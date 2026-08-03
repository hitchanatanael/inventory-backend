const allowedPeriods = [
    "today",
    "this_week",
    "this_month",
    "this_year",
    "custom",
];

const isValidDateString = (value) => {
    if (typeof value !== "string") {
        return false;
    }

    const pattern = /^\d{4}-\d{2}-\d{2}$/;

    if (!pattern.test(value)) {
        return false;
    }

    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));

    return (
        date.getUTCFullYear() === year &&
        date.getUTCMonth() === month - 1 &&
        date.getUTCDate() === day
    );
};

const isPositiveInteger = (value) => {
    const numberValue = Number(value);

    return Number.isInteger(numberValue) && numberValue > 0;
};

const parseDashboardQuery = (query = {}) => {
    const period = query.period ? String(query.period).trim() : "this_month";

    if (!allowedPeriods.includes(period)) {
        return {
            error: `Period harus salah satu dari: ${allowedPeriods.join(", ")}`,
        };
    }

    const filters = {
        period,
    };

    if (period === "custom") {
        if (!query.start_date || !query.end_date) {
            return {
                error: "start_date dan end_date wajib diisi untuk period custom",
            };
        }

        filters.start_date = String(query.start_date).trim();
        filters.end_date = String(query.end_date).trim();

        if (
            !isValidDateString(filters.start_date) ||
            !isValidDateString(filters.end_date)
        ) {
            return {
                error: "start_date dan end_date harus berupa tanggal valid YYYY-MM-DD",
            };
        }

        if (filters.start_date > filters.end_date) {
            return {
                error: "start_date tidak boleh setelah end_date",
            };
        }
    }

    if (query.id_lokasi !== undefined && query.id_lokasi !== "") {
        if (!isPositiveInteger(query.id_lokasi)) {
            return {
                error: "id_lokasi harus berupa angka positif",
            };
        }

        filters.id_lokasi = Number(query.id_lokasi);
    }

    if (query.recent_limit !== undefined && query.recent_limit !== "") {
        if (!isPositiveInteger(query.recent_limit)) {
            return {
                error: "recent_limit harus berupa angka 1 sampai 20",
            };
        }

        const recentLimit = Number(query.recent_limit);

        if (recentLimit < 1 || recentLimit > 20) {
            return {
                error: "recent_limit harus berupa angka 1 sampai 20",
            };
        }

        filters.recent_limit = recentLimit;
    }

    return {
        filters,
    };
};

module.exports = {
    parseDashboardQuery,
};
