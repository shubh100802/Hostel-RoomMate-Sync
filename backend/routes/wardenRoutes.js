// ============ WARDEN ROUTES ============
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Warden = require('../models/Warden');
const authMiddleware = require('../middleware/authMiddleware');
const TimeWindow = require('../models/TimeWindow');
const Student = require('../models/Student');
const RoommateRequest = require('../models/RoommateRequest');
const ExcelJS = require('exceljs');

// ============ MIDDLEWARE ============
const wardenAuth = (req, res, next) => {
    if (req.user.role !== 'warden') {
        return res.status(403).json({ msg: 'Access denied. Warden privileges required.' });
    }
    next();
};

// ============ WARDEN MANAGEMENT ============
router.post('/add', authMiddleware, wardenAuth, async (req, res) => {
    try {
        const { email, name, password } = req.body;

        if (!email || !name || !password) {
            return res.status(400).json({ msg: 'Please provide all required fields' });
        }

        const existingWarden = await Warden.findOne({ email });
        if (existingWarden) {
            return res.status(400).json({ msg: 'Warden with this email already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newWarden = new Warden({
            email,
            name,
            password: hashedPassword
        });

        await newWarden.save();

        const wardenData = {
            _id: newWarden._id,
            email: newWarden.email,
            name: newWarden.name
        };

        res.status(201).json({
            msg: 'Warden added successfully',
            warden: wardenData
        });

    } catch (error) {
        console.error('Add warden error:', error);
        res.status(500).json({ msg: 'Server error' });
    }
});

router.get('/all', authMiddleware, wardenAuth, async (req, res) => {
    try {
        const wardens = await Warden.find({}, '-password');
        res.json({ wardens });
    } catch (error) {
        console.error('Get wardens error:', error);
        res.status(500).json({ msg: 'Server error' });
    }
});

router.get('/:id', authMiddleware, wardenAuth, async (req, res) => {
    try {
        const warden = await Warden.findById(req.params.id, '-password');
        if (!warden) {
            return res.status(404).json({ msg: 'Warden not found' });
        }
        res.json({ warden });
    } catch (error) {
        console.error('Get warden error:', error);
        res.status(500).json({ msg: 'Server error' });
    }
});

router.put('/:id', authMiddleware, wardenAuth, async (req, res) => {
    try {
        const { email, name, password } = req.body;
        const updateData = {};

        if (email) updateData.email = email;
        if (name) updateData.name = name;
        if (password) {
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(password, salt);
        }

        const warden = await Warden.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        if (!warden) {
            return res.status(404).json({ msg: 'Warden not found' });
        }

        res.json({
            msg: 'Warden updated successfully',
            warden
        });

    } catch (error) {
        console.error('Update warden error:', error);
        res.status(500).json({ msg: 'Server error' });
    }
});

router.delete('/:id', authMiddleware, wardenAuth, async (req, res) => {
    try {
        const warden = await Warden.findByIdAndDelete(req.params.id);
        if (!warden) {
            return res.status(404).json({ msg: 'Warden not found' });
        }

        res.json({ msg: 'Warden deleted successfully' });

    } catch (error) {
        console.error('Delete warden error:', error);
        res.status(500).json({ msg: 'Server error' });
    }
});

// ============ WARDEN PROFILE ============
router.get('/profile/me', authMiddleware, wardenAuth, async (req, res) => {
    try {
        const warden = await Warden.findById(req.user.id, '-password');
        if (!warden) {
            return res.status(404).json({ msg: 'Warden not found' });
        }
        res.json({ warden });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ msg: 'Server error' });
    }
});

router.put('/profile/me', authMiddleware, wardenAuth, async (req, res) => {
    try {
        const { name, currentPassword, newPassword } = req.body;
        const updateData = {};

        if (name) updateData.name = name;

        if (newPassword) {
            const warden = await Warden.findById(req.user.id);
            if (!warden) {
                return res.status(404).json({ msg: 'Warden not found' });
            }

            if (!currentPassword) {
                return res.status(400).json({ msg: 'Current password is required to change password' });
            }

            const isMatch = await bcrypt.compare(currentPassword, warden.password);
            if (!isMatch) {
                return res.status(400).json({ msg: 'Current password is incorrect' });
            }

            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(newPassword, salt);
        }

        const updatedWarden = await Warden.findByIdAndUpdate(
            req.user.id,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        res.json({
            msg: 'Profile updated successfully',
            warden: updatedWarden
        });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ msg: 'Server error' });
    }
});

// ============ TIME WINDOW MANAGEMENT ============
router.post('/set-time-window', authMiddleware, wardenAuth, async (req, res) => {
    const { start, end } = req.body;
    if (!start || !end) return res.status(400).json({ msg: 'Start and end required' });
    try {
        await TimeWindow.deleteMany({});
        const tw = await TimeWindow.create({ start, end });
        res.json({ msg: 'Time window set', window: tw });
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

// ============ REPORT GENERATION ============
router.get('/download-report', authMiddleware, wardenAuth, async (req, res) => {
    try {
        const students = await Student.find({}).populate('committedRoommateRequest');
        const roommateRequests = await RoommateRequest.find({})
            .populate('requester')
            .populate('requestedStudents.student');

        const groups = [];
        const processedStudents = new Set();
        const naStudents = [];
        const notFilledStudents = [];

        // Find mutually matched groups
        for (const request of roommateRequests) {
            if (request.status === 'completed') {
                const groupMembers = [request.requester];
                
                for (const requested of request.requestedStudents) {
                    if (requested.status === 'accepted') {
                        groupMembers.push(requested.student);
                        processedStudents.add(requested.student._id.toString());
                    }
                }
                
                processedStudents.add(request.requester._id.toString());
                
                if (groupMembers.length > 1) {
                    groups.push({
                        members: groupMembers,
                        bedType: request.bedType,
                        groupId: groups.length + 1
                    });
                }
            }
        }

        // Categorize remaining students
        for (const student of students) {
            if (!processedStudents.has(student._id.toString())) {
                if (student.hasSubmittedMutualForm) {
                    if (student.mutualPreferences && student.mutualPreferences.includes('NA')) {
                        naStudents.push(student);
                    } else {
                        naStudents.push(student);
                    }
                } else {
                    notFilledStudents.push(student);
                }
            }
        }

        // Create workbook
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Mutual Sharing Report');

        worksheet.columns = [
            { header: 'Group ID', key: 'group', width: 15 },
            { header: 'Name', key: 'name', width: 25 },
            { header: 'Registration Number', key: 'regno', width: 20 },
            { header: 'Email', key: 'email', width: 30 },
            { header: 'Bed Type', key: 'bedType', width: 20 },
            { header: 'Status', key: 'status', width: 22 },
            { header: 'Preferences', key: 'preferences', width: 35 }
        ];

        // Add mutually matched groups
        for (const group of groups) {
            for (const member of group.members) {
                worksheet.addRow({
                    group: `Group ${group.groupId}`,
                    name: member.name,
                    regno: member.regno,
                    email: member.email,
                    bedType: group.bedType,
                    status: 'Mutually Matched',
                    preferences: member.mutualPreferences ? member.mutualPreferences.join(', ') : 'N/A'
                });
            }
            worksheet.addRow({});
        }

        // Add NA students
        const naByBedType = {};
        for (const student of naStudents) {
            if (!naByBedType[student.bedType]) {
                naByBedType[student.bedType] = [];
            }
            naByBedType[student.bedType].push(student);
        }

        for (const [bedType, students] of Object.entries(naByBedType)) {
            for (const student of students) {
                worksheet.addRow({
                    group: 'NA Group',
                    name: student.name,
                    regno: student.regno,
                    email: student.email,
                    bedType,
                    status: 'Random Roommate',
                    preferences: student.mutualPreferences ? student.mutualPreferences.join(', ') : 'NA'
                });
            }
            worksheet.addRow({});
        }

        // Add students who haven't filled the form
        const notFilledByBedType = {};
        for (const student of notFilledStudents) {
            if (!notFilledByBedType[student.bedType]) {
                notFilledByBedType[student.bedType] = [];
            }
            notFilledByBedType[student.bedType].push(student);
        }

        for (const [bedType, students] of Object.entries(notFilledByBedType)) {
            for (const student of students) {
                worksheet.addRow({
                    group: 'Not Filled',
                    name: student.name,
                    regno: student.regno,
                    email: student.email,
                    bedType,
                    status: 'Form Not Submitted',
                    preferences: 'NA'
                });
            }
            worksheet.addRow({});
        }

        // Style header
        worksheet.getRow(1).eachCell(cell => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: '22223B' }
            };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
        });

        // Apply colors to rows
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return;
            const groupCell = row.getCell(1).value;
            let fillColor = null;
            let fontColor = 'FFFFFFFF';
            if (!groupCell) return;
            if (typeof groupCell !== 'string') return;
            if (groupCell.startsWith('Group')) {
                const groupId = parseInt(groupCell.split(' ')[1]);
                fillColor = getGroupColor(groupId);
            } else if (groupCell === 'NA Group') {
                fillColor = 'FF6B6B';
            } else if (groupCell === 'Not Filled') {
                fillColor = 'FFA500';
            }
            if (fillColor) {
                row.eachCell(cell => {
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: fillColor }
                    };
                    cell.font = { color: { argb: fontColor }, bold: true };
                });
            }
        });

        const buffer = await workbook.xlsx.writeBuffer();
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="mutual_sharing_report.xlsx"');
        res.send(buffer);
    } catch (error) {
        console.error('Download report error:', error);
        res.status(500).json({ msg: 'Server error while generating report' });
    }
});

// ============ HELPER FUNCTIONS ============
function getGroupColor(groupId) {
    const colors = [
        '4A90E2', '50C878', 'FF6B6B', 'FFD93D', '9B59B6',
        'E67E22', '1ABC9C', 'E74C3C', '3498DB', '2ECC71',
        'F39C12', '8E44AD', '16A085', 'C0392B', '2980B9'
    ];
    return colors[(groupId - 1) % colors.length];
}

module.exports = router; 