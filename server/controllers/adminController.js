import Complaint from '../models/Complaint.js';

export const getDashboardStats = async (req, res) => {
  try {
    const totalComplaints = await Complaint.countDocuments();
    const pendingComplaints = await Complaint.countDocuments({ status: 'pending' });
    const assignedComplaints = await Complaint.countDocuments({ status: 'assigned' });
    const inProgressComplaints = await Complaint.countDocuments({ status: 'in_progress' });
    const resolvedComplaints = await Complaint.countDocuments({ status: 'resolved' });
    const unresolvedComplaints = await Complaint.countDocuments({
      status: { $nin: ['resolved', 'rejected'] }
    });

    const categoryStats = await Complaint.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    const byCategory = categoryStats.map(stat => ({
      category: stat._id,
      count: stat.count
    }));

    const locationStats = await Complaint.aggregate([
      {
        $lookup: {
          from: 'locations',
          localField: 'location',
          foreignField: '_id',
          as: 'locationDetails'
        }
      },
      {
        $unwind: { path: '$locationDetails', preserveNullAndEmptyArrays: true }
      },
      {
        $group: {
          _id: '$location',
          locationName: { $first: '$locationDetails.name' },
          building: { $first: '$locationDetails.building' },
          count: { $sum: 1 }
        }
      }
    ]);
    
    const byLocation = locationStats.map(stat => ({
      locationId: stat._id,
      locationName: stat.locationName || 'Unknown Location',
      building: stat.building || 'Unknown Building',
      count: stat.count
    }));

    const recentComplaints = await Complaint.find()
      .sort({ createdAt: -1 })
      .populate('student', 'name email')
      .populate('assignedTo', 'name')
      .populate('location', 'name building')
      .limit(10);

    const unresolvedComplaintsList = await Complaint.find({ status: { $nin: ['resolved', 'rejected'] } })
      .sort({ createdAt: 1 })
      .populate('student', 'name email')
      .populate('assignedTo', 'name')
      .populate('location', 'name building');

    res.json({
      summary: {
        totalComplaints,
        pendingComplaints,
        assignedComplaints,
        inProgressComplaints,
        resolvedComplaints,
        unresolvedComplaints
      },
      byCategory,
      byLocation,
      recentComplaints,
      unresolvedComplaintsList
    });
  } catch (error) {
    console.error('Error in getDashboardStats:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

export const getRecurringIssues = async (req, res) => {
  try {
    const issues = await Complaint.aggregate([
      {
        $lookup: {
          from: 'locations',
          localField: 'location',
          foreignField: '_id',
          as: 'locationDetails'
        }
      },
      {
        $unwind: { path: '$locationDetails', preserveNullAndEmptyArrays: true }
      },
      {
        $group: {
          _id: { location: '$location', category: '$category' },
          locationName: { $first: '$locationDetails.name' },
          building: { $first: '$locationDetails.building' },
          complaintCount: { $sum: 1 },
          unresolvedCount: {
            $sum: {
              $cond: [{ $in: ['$status', ['resolved', 'rejected']] }, 0, 1]
            }
          },
          latestComplaintDate: { $max: '$createdAt' }
        }
      },
      {
        $sort: { complaintCount: -1 }
      }
    ]);

    const result = issues.map(issue => {
      let frequencyLevel = 'normal';
      if (issue.complaintCount >= 5 && issue.complaintCount <= 9) {
        frequencyLevel = 'frequent';
      } else if (issue.complaintCount >= 10) {
        frequencyLevel = 'recurring';
      }

      return {
        location: {
          id: issue._id.location,
          name: issue.locationName || 'Unknown Location',
          building: issue.building || 'Unknown Building'
        },
        category: issue._id.category,
        complaintCount: issue.complaintCount,
        unresolvedCount: issue.unresolvedCount,
        frequencyLevel,
        latestComplaintDate: issue.latestComplaintDate
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Error in getRecurringIssues:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

export const getFollowUpComplaints = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const complaints = await Complaint.find({
      status: { $nin: ['resolved', 'rejected'] },
      createdAt: { $lte: thirtyDaysAgo }
    })
      .sort({ createdAt: 1 })
      .populate('student', 'name email registerNumber department year className')
      .populate('assignedTo', 'name email department')
      .populate('location', 'name building');

    const result = complaints.map((complaint) => {
      const msOpen = new Date().getTime() - new Date(complaint.createdAt).getTime();
      const daysOpen = Math.floor(msOpen / (1000 * 60 * 60 * 24));
      
      return {
        ...complaint.toObject(),
        daysOpen,
        followUpRequired: true,
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Error in getFollowUpComplaints:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};
