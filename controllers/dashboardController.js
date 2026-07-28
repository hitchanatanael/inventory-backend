const dashboardService = require('../services/dashboardService');
const response = require('../utils/response');

const getDashboardStatistics = async (req, res) => {
  try {
    const data = await dashboardService.getDashboardStatistics(req.locationScope);

    return response.success(res, 'Statistik dashboard berhasil diambil', data);
  } catch (error) {
    return response.error(res, 'Gagal mengambil statistik dashboard');
  }
};

module.exports = {
  getDashboardStatistics,
};
