const Lead = require('../models/Lead');
const Activity = require('../models/Activity');
const User = require('../models/AuthUser');

const getDateFilter = (startDate, endDate) => {
  const filter = {};
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) {
      filter.createdAt.$gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }
  return filter;
};

exports.getDashboardData = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = getDateFilter(startDate, endDate);

    const totalLeads = await Lead.countDocuments(dateFilter);

    const leadsByStatusRaw = await Lead.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const statusMap = {
      New: 0,
      Contacted: 0,
      Qualified: 0,
      Proposal: 0,
      Won: 0,
      Lost: 0
    };
    leadsByStatusRaw.forEach((item) => {
      if (item._id) statusMap[item._id] = item.count;
    });

    const leadsByStatus = Object.keys(statusMap).map((status) => ({
      status,
      count: statusMap[status]
    }));

    const leadSources = await Lead.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$source', count: { $sum: 1 } } },
      { $project: { _id: 0, source: '$_id', count: 1 } },
      { $sort: { count: -1 } }
    ]);

    const wonCount = statusMap['Won'] || 0;
    const lostCount = statusMap['Lost'] || 0;
    const conversionRate = totalLeads > 0 ? ((wonCount / totalLeads) * 100).toFixed(2) : 0;
    
    const totalValueResult = await Lead.aggregate([
      { $match: { ...dateFilter, status: 'Won' } },
      { $group: { _id: null, totalValue: { $sum: '$dealValue' } } }
    ]);
    const totalRevenue = totalValueResult.length > 0 ? totalValueResult[0].totalValue : 0;

    const employeeActivities = await Activity.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$performedBy',
          totalActivities: { $sum: 1 },
          calls: { $sum: { $cond: [{ $eq: ['$type', 'Call'] }, 1, 0] } },
          emails: { $sum: { $cond: [{ $eq: ['$type', 'Email'] }, 1, 0] } },
          meetings: { $sum: { $cond: [{ $eq: ['$type', 'Meeting'] }, 1, 0] } }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'employee'
        }
      },
      { $unwind: '$employee' },
      {
        $project: {
          _id: 1,
          name: '$employee.name',
          email: '$employee.email',
          totalActivities: 1,
          calls: 1,
          emails: 1,
          meetings: 1
        }
      },
      { $sort: { totalActivities: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalLeads,
          wonLeads: wonCount,
          lostLeads: lostCount,
          conversionRate: Number(conversionRate),
          totalRevenue
        },
        leadsByStatus,
        leadSources,
        employeeActivities
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard analytics.',
      error: error.message
    });
  }
};

exports.exportLeadsCSV = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = getDateFilter(startDate, endDate);

    const leads = await Lead.find(dateFilter).populate('assignedTo', 'name email').lean();
    if (!leads || leads.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No leads found for the selected date range.'
      });
    }

    const headers = [
      'ID',
      'Name',
      'Email',
      'Phone',
      'Company',
      'Status',
      'Source',
      'Deal Value($)',
      'Assigned To',
      'Created At'
    ];

    const formatField = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const csvRows = [
      headers.join(','),
      ...leads.map((lead) =>
        [
          formatField(lead._id),
          formatField(lead.name),
          formatField(lead.email),
          formatField(lead.phone),
          formatField(lead.company),
          formatField(lead.status),
          formatField(lead.source),
          formatField(lead.dealValue || 0),
          formatField(lead.assignedTo?.name || 'Unassigned'),
          formatField(new Date(lead.createdAt).toISOString().split('T')[0])
        ].join(',')
      )
    ];

    const csvContent = csvRows.join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=leads_export_${new Date().toISOString().split('T')[0]}.csv`);
    return res.status(200).send(csvContent);
  } catch (error) {
    console.error('Error exporting CSV:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export leads data.',
      error: error.message
    });
  }
};