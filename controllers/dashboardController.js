const dashboardService = require('../services/dashboardService');
const response = require('../utils/response');
const {
  parseDashboardQuery,
} = require('../validators/dashboardValidator');

const getDashboardStatistics = async (req, res) => {
  try {
    const { filters, error } = parseDashboardQuery(req.query);

    if (error) {
      return response.error(res, error, 400);
    }

    const data = await dashboardService.getDashboardStatistics(
      filters,
      req.locationScope
    );

    return response.success(res, 'Dashboard berhasil dimuat', data);
  } catch (error) {
    if (error.statusCode) {
      return response.error(res, error.message, error.statusCode);
    }

    return response.error(res, 'Gagal mengambil statistik dashboard');
  }
};

module.exports = {
  getDashboardStatistics,
};
