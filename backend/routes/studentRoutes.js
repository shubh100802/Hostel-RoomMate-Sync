// ============ STUDENT ROUTES ============
const express = require('express');
const router = express.Router();
const multer = require('multer');
const xlsx = require('xlsx');
const bcrypt = require('bcryptjs');
const Student = require('../models/Student');
const RoommateRequest = require('../models/RoommateRequest');
const authMiddleware = require('../middleware/authMiddleware');
const TimeWindow = require('../models/TimeWindow');
const wardenAuth = require('../middleware/authMiddleware').wardenAuth;

// ============ FILE UPLOAD CONFIGURATION ============
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ============ STUDENT UPLOAD (WARDEN ONLY) ============
router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
    console.log('Student upload route hit');
    if (!req.file) {
        console.log('No file uploaded');
        return res.status(400).json({ msg: 'No file uploaded' });
    }
    try {
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const raw = xlsx.utils.sheet_to_json(sheet, { defval: '' });
        console.log('Parsed rows from Excel:', raw.length, raw);
        let added = 0, skipped = 0, errors = [];
        for (const [i, row] of raw.entries()) {
            const name = row.name || row.Name || row.NAME || row["Name "] || '';
            const email = row.email || row.Email || row.EMAIL || row["Email "] || '';
            const regno = row.regno || row.RegNo || row["Reg No"] || row["RegNo"] || row["reg no"] || '';
            const bedType = row.bedType || row.BedType || row["Bed Type"] || row["bed type"] || '';
            if (!name || !email || !regno || !bedType) {
                skipped++;
                errors.push(`Row ${i+2}: Missing data. name='${name}', email='${email}', regno='${regno}', bedType='${bedType}'`);
                continue;
            }
            const exists = await Student.findOne({ $or: [{ email }, { regno }] });
            if (exists) {
                skipped++;
                errors.push(`Row ${i+2}: Student already exists (email/regno)`);
                continue;
            }
            const hashedPassword = await bcrypt.hash(regno, 10);
            await Student.create({
                name,
                email,
                regno,
                bedType,
                password: hashedPassword
            });
            added++;
        }
        console.log(`Student upload finished: added=${added}, skipped=${skipped}, errors=`, errors);
        res.json({ success: true, msg: `Added ${added} students, skipped ${skipped}.`, errors });
    } catch (err) {
        console.error('Student upload error:', err);
        res.status(500).json({ msg: 'Server error during upload' });
    }
});

// ============ STUDENT SEARCH ============
router.get('/by-regno/:regno', async (req, res) => {
    const { regno } = req.params;
    const { bedType } = req.query;
    if (!regno || !bedType) {
        return res.status(400).json({ msg: 'regno and bedType are required' });
    }
    try {
        function normalize(str) {
          if (!str) return '';
          return str
            .toLowerCase()
            .replace(/bedded|bed/g, '')
            .replace(/a\/?c|ac/g, 'ac')
            .replace(/non\s*a\/?c|nonac/g, 'nonac')
            .replace(/one|1/g, '1')
            .replace(/two|2/g, '2')
            .replace(/three|3/g, '3')
            .replace(/four|4/g, '4')
            .replace(/five|5/g, '5')
            .replace(/six|6/g, '6')
            .replace(/seven|7/g, '7')
            .replace(/eight|8/g, '8')
            .replace(/[^a-z0-9]/g, '')
            .trim();
        }
        const students = await Student.find({ regno });
        const normQuery = normalize(bedType);
        students.forEach(s => {
          console.log(`Comparing: DB='${s.bedType}' -> '${normalize(s.bedType)}' vs Query='${bedType}' -> '${normQuery}'`);
        });
        const match = students.find(s => normalize(s.bedType) === normQuery);
        if (!match) {
            return res.status(404).json({ msg: 'Not found' });
        }
        res.json({ name: match.name, email: match.email });
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
});

// ============ MUTUAL PREFERENCES ============
router.post('/mutual-preference', authMiddleware, async (req, res) => {
    const { preferences } = req.body;
    if (!Array.isArray(preferences)) {
        return res.status(400).json({ msg: 'preferences must be an array' });
    }
    try {
        const student = await Student.findById(req.user.id);
        if (!student) return res.status(404).json({ msg: 'Student not found' });
        
        if (student.hasSubmittedMutualForm || student.isCommittedToRoommate) {
            return res.status(400).json({ msg: 'You have already submitted preferences or are committed to a roommate' });
        }

        const validRegnos = preferences.filter(pref => pref.toUpperCase() !== 'NA' && pref.trim() !== '');
        const requestedStudents = [];
        
        function normalize(str) {
          if (!str) return '';
          return str
            .toLowerCase()
            .replace(/bedded|bed/g, '')
            .replace(/a\/?c|ac/g, 'ac')
            .replace(/non\s*a\/?c|nonac/g, 'nonac')
            .replace(/one|1/g, '1')
            .replace(/two|2/g, '2')
            .replace(/three|3/g, '3')
            .replace(/four|4/g, '4')
            .replace(/five|5/g, '5')
            .replace(/six|6/g, '6')
            .replace(/seven|7/g, '7')
            .replace(/eight|8/g, '8')
            .replace(/[^a-z0-9]/g, '')
            .trim();
        }
        
        const normalizedSelfBedType = normalize(student.bedType);
        for (const regno of validRegnos) {
            const candidates = await Student.find({
                regno: { $regex: `^${regno.trim()}$`, $options: 'i' },
                _id: { $ne: student._id }
            });
            const foundStudent = candidates.find(s => normalize(s.bedType) === normalizedSelfBedType && !s.isCommittedToRoommate);
            if (foundStudent) {
                requestedStudents.push(foundStudent._id);
                console.log(`[MUTUAL REQUEST] Found student for regno ${regno}: ${foundStudent.name} (${foundStudent._id})`);
            } else {
                console.log(`[MUTUAL REQUEST] No eligible student found for regno ${regno}`);
            }
        }

        const roommateRequest = await RoommateRequest.create({
            requester: student._id,
            requestedStudents: requestedStudents.map(studentId => ({
                student: studentId,
                status: 'pending'
            })),
            bedType: student.bedType
        });

        student.mutualPreferences = preferences;
        student.hasSubmittedMutualForm = true;
        await student.save();

        res.json({ 
            msg: 'Mutual preferences saved and roommate requests sent successfully',
            requestId: roommateRequest._id,
            requestedCount: requestedStudents.length
        });
    } catch (err) {
        console.error('Error in mutual preference:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

router.get('/mutual-preferences-details', authMiddleware, async (req, res) => {
    try {
        const student = await Student.findById(req.user.id);
        if (!student || !Array.isArray(student.mutualPreferences)) {
            return res.json([]);
        }
        const details = await Promise.all(student.mutualPreferences.map(async regno => {
            if (!regno || regno.toUpperCase() === 'NA') return { regno: 'NA', name: 'NA', email: 'NA' };
            const s = await Student.findOne({ regno: { $regex: `^${regno.trim()}$`, $options: 'i' } });
            if (s) return { regno: s.regno, name: s.name, email: s.email };
            return { regno, name: 'Not found', email: '-' };
        }));
        res.json(details);
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
});

// ============ ROOMMATE REQUESTS ============
router.get('/pending-requests', authMiddleware, async (req, res) => {
    try {
        const requests = await RoommateRequest.find({
            'requestedStudents.student': req.user.id,
            'requestedStudents.status': 'pending',
            status: 'active'
        }).populate('requester', 'name regno email').lean();
        
        const formattedRequests = await Promise.all(requests.map(async req => {
            const requestedDetails = await Promise.all(req.requestedStudents.map(async entry => {
                const s = await Student.findById(entry.student);
                if (s) return { regno: s.regno, name: s.name, email: s.email };
                return { regno: 'NA', name: 'NA', email: 'NA' };
            }));
            const group = [{ regno: req.requester.regno, name: req.requester.name, email: req.requester.email }, ...requestedDetails];
            return {
                id: req._id,
                requester: req.requester,
                bedType: req.bedType,
                createdAt: req.createdAt,
                group
            };
        }));
        
        res.json(formattedRequests);
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
});

router.post('/respond-to-request/:requestId', authMiddleware, async (req, res) => {
    const { requestId } = req.params;
    const { response } = req.body;
    
    if (!['accept', 'decline'].includes(response)) {
        return res.status(400).json({ msg: 'Response must be accept or decline' });
    }
    
    try {
        const roommateRequest = await RoommateRequest.findById(requestId);
        if (!roommateRequest) {
            return res.status(404).json({ msg: 'Request not found' });
        }
        
        const studentEntry = roommateRequest.requestedStudents.find(
            entry => entry.student.toString() === req.user.id
        );
        
        if (!studentEntry || studentEntry.status !== 'pending') {
            return res.status(400).json({ msg: 'Invalid request or already responded' });
        }
        
        studentEntry.status = response === 'accept' ? 'accepted' : 'declined';
        studentEntry.respondedAt = new Date();
        
        if (response === 'accept') {
            await Student.findByIdAndUpdate(req.user.id, {
                isCommittedToRoommate: true,
                committedRoommateRequest: requestId
            });
        }
        
        const allResponded = roommateRequest.requestedStudents.every(
            entry => entry.status !== 'pending'
        );
        
        if (allResponded) {
            const allAccepted = roommateRequest.requestedStudents.every(
                entry => entry.status === 'accepted'
            );
            
            if (allAccepted) {
                roommateRequest.status = 'completed';
                await Student.findByIdAndUpdate(roommateRequest.requester, {
                    isCommittedToRoommate: true,
                    committedRoommateRequest: requestId
                });
            } else {
                roommateRequest.status = 'cancelled';
                await Student.findByIdAndUpdate(roommateRequest.requester, {
                    hasSubmittedMutualForm: false
                });
            }
        }
        
        await roommateRequest.save();
        
        res.json({ 
            msg: `Request ${response}d successfully`,
            status: roommateRequest.status
        });
    } catch (err) {
        console.error('Error responding to request:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// ============ STUDENT STATUS & GROUPS ============
router.get('/status', authMiddleware, async (req, res) => {
    try {
        const student = await Student.findById(req.user.id);
        if (!student) return res.status(404).json({ msg: 'Student not found' });
        
        const pendingCount = await RoommateRequest.countDocuments({
            'requestedStudents.student': req.user.id,
            'requestedStudents.status': 'pending',
            status: 'active'
        });
        
        res.json({
            hasSubmittedMutualForm: student.hasSubmittedMutualForm,
            isCommittedToRoommate: student.isCommittedToRoommate,
            pendingRequestsCount: pendingCount,
            mutualPreferences: student.mutualPreferences || []
        });
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
});

router.get('/get-time-window', async (req, res) => {
    try {
        const tw = await TimeWindow.findOne({});
        if (!tw) return res.status(404).json({ msg: 'No time window set' });
        res.json({ start: tw.start, end: tw.end });
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
});

router.get('/incoming-roommate-group', authMiddleware, async (req, res) => {
    try {
        const reqs = await RoommateRequest.find({
            'requestedStudents.student': req.user.id,
            status: { $in: ['active', 'completed'] }
        }).populate('requester', 'name regno email').lean();
        if (!reqs || reqs.length === 0) return res.json(null);
        
        const reqDoc = reqs[0];
        const requestedDetails = await Promise.all(reqDoc.requestedStudents.map(async entry => {
            const s = await Student.findById(entry.student);
            if (s) return { regno: s.regno, name: s.name, email: s.email };
            return { regno: 'NA', name: 'NA', email: 'NA' };
        }));
        const group = [{ regno: reqDoc.requester.regno, name: reqDoc.requester.name, email: reqDoc.requester.email }, ...requestedDetails];
        res.json({
            requester: reqDoc.requester,
            group
        });
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
});

router.get('/my-roommate-group', authMiddleware, async (req, res) => {
    try {
        const student = await Student.findById(req.user.id);
        let reqDoc = null;
        if (student && student.committedRoommateRequest) {
            reqDoc = await RoommateRequest.findById(student.committedRoommateRequest)
                .populate('requester', 'name regno email')
                .lean();
        }
        if (!reqDoc) {
            const reqs = await RoommateRequest.find({
                'requestedStudents.student': req.user.id,
                status: { $in: ['active', 'completed'] }
            }).sort({ createdAt: -1 }).populate('requester', 'name regno email').lean();
            if (reqs && reqs.length > 0) reqDoc = reqs[0];
        }
        if (!reqDoc) return res.json(null);
        
        const requestedDetails = await Promise.all(reqDoc.requestedStudents.map(async entry => {
            const s = await Student.findById(entry.student);
            if (s) return { regno: s.regno, name: s.name, email: s.email };
            return { regno: 'NA', name: 'NA', email: 'NA' };
        }));
        const group = [{ regno: reqDoc.requester.regno, name: reqDoc.requester.name, email: reqDoc.requester.email }, ...requestedDetails];
        res.json({
            requester: reqDoc.requester,
            group
        });
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
});

router.get('/my-pending-group', authMiddleware, async (req, res) => {
    try {
        const student = await Student.findById(req.user.id);
        if (!student || !student.hasSubmittedMutualForm || student.isCommittedToRoommate) {
            return res.json(null);
        }
        const reqDoc = await RoommateRequest.findOne({
            requester: student._id,
            status: 'active'
        }).sort({ createdAt: -1 }).lean();
        if (!reqDoc) return res.json(null);
        
        const requestedDetails = await Promise.all(reqDoc.requestedStudents.map(async entry => {
            const s = await Student.findById(entry.student);
            if (s) return { regno: s.regno, name: s.name, email: s.email, status: entry.status };
            return { regno: 'NA', name: 'NA', email: 'NA', status: entry.status };
        }));
        const group = [{ regno: student.regno, name: student.name, email: student.email, status: 'requester' }, ...requestedDetails];
        res.json({
            group,
            waiting: requestedDetails.filter(s => s.status === 'pending').map(s => s.name)
        });
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
});

router.get('/has-active-incoming-request', authMiddleware, async (req, res) => {
    try {
        const reqDoc = await RoommateRequest.findOne({
            'requestedStudents.student': req.user.id,
            'requestedStudents.status': { $in: ['pending', 'accepted'] },
            status: { $in: ['active', 'completed'] }
        }).populate('requester', 'name regno email');
        if (!reqDoc) return res.json({ hasActive: false });
        res.json({
            hasActive: true,
            requester: reqDoc.requester,
            status: reqDoc.status
        });
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
});

// ============ WARDEN MANAGEMENT (WARDEN ONLY) ============
router.delete('/delete-all', authMiddleware, wardenAuth, async (req, res) => {
    try {
        const result = await Student.deleteMany({});
        res.json({ msg: 'All students deleted successfully.', deletedCount: result.deletedCount });
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
});

router.delete('/delete-all-preferences', authMiddleware, wardenAuth, async (req, res) => {
    try {
        const prefResult = await RoommateRequest.deleteMany({});
        const studResult = await Student.updateMany({}, {
            $set: {
                isCommittedToRoommate: false,
                committedRoommateRequest: null,
                hasSubmittedMutualForm: false,
                mutualPreferences: []
            }
        });
        res.json({ msg: 'All mutual preferences deleted and student statuses reset.', deletedPreferences: prefResult.deletedCount, updatedStudents: studResult.modifiedCount });
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
});

// ============ FINAL ROOM ALLOTMENT (WARDEN ONLY) ============
router.post('/upload-final-allotment', authMiddleware, wardenAuth, upload.single('file'), async (req, res) => {
    const ExcelJS = require('exceljs');
    if (!req.file) {
        return res.status(400).json({ msg: 'No file uploaded' });
    }
    try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(req.file.buffer);
        const worksheet = workbook.worksheets[0];
        let updated = 0, notFound = 0, errors = [], total = 0;
        
        const rows = [];
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return;
            rows.push(row);
        });
        
        for (const [i, row] of rows.entries()) {
            const rowNumber = i + 2;
            const regno = (row.getCell(1).value || '').toString().trim();
            const name = (row.getCell(2).value || '').toString().trim();
            const email = (row.getCell(3).value || '').toString().trim();
            const bedType = (row.getCell(4).value || '').toString().trim();
            const roomNo = (row.getCell(5).value || '').toString().trim();
            if (!regno || !roomNo) {
                errors.push(`Row ${rowNumber}: Missing regno or roomNo.`);
                continue;
            }
            total++;
            const doc = await Student.findOneAndUpdate(
                { regno: { $regex: `^${regno}$`, $options: 'i' } },
                { finalRoomNo: roomNo },
                { new: true }
            );
            if (!doc) {
                notFound++;
                errors.push(`Row ${rowNumber}: Student with regno ${regno} not found.`);
            } else {
                updated++;
            }
        }
        res.json({
            msg: `Processed ${total} rows. Updated: ${updated}, Not found: ${notFound}.`,
            errors
        });
    } catch (err) {
        console.error('Final allotment upload error:', err);
        res.status(500).json({ msg: 'Server error during final allotment upload' });
    }
});

router.get('/all-roomnos', authMiddleware, wardenAuth, async (req, res) => {
    try {
        const students = await Student.find({}, 'regno name email finalRoomNo');
        res.json(students);
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
});

router.delete('/delete-all-allocations', authMiddleware, wardenAuth, async (req, res) => {
    try {
        const result = await Student.updateMany(
            { finalRoomNo: { $exists: true, $ne: '' } },
            { $unset: { finalRoomNo: "" } }
        );
        res.json({ 
            msg: 'All allocated rooms deleted successfully.', 
            deletedCount: result.modifiedCount 
        });
    } catch (err) {
        console.error('Delete allocations error:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// ============ STUDENT PROFILE ============
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const student = await Student.findById(req.user.id);
        if (!student) return res.status(404).json({ msg: 'Student not found' });
        res.json({ student });
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router; 