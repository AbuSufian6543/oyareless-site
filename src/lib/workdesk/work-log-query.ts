export const WORK_LOG_INCLUDE = {
  timeEntries: {
    orderBy: [{ workedOn: "desc" as const }, { createdAt: "desc" as const }],
    include: { user: { select: { id: true as const, name: true as const } } },
  },
  productUsages: {
    orderBy: { createdAt: "desc" as const },
    include: { addedBy: { select: { id: true as const, name: true as const } } },
  },
};

/** Light include for ticket/task lists (hours + product count). */
export const WORK_LOG_LIST_INCLUDE = {
  timeEntries: { select: { minutes: true as const } },
  _count: { select: { productUsages: true as const } },
};

export function workLogTotals(item: {
  timeEntries: { minutes: number }[];
  _count: { productUsages: number };
}): { minutes: number; productCount: number } {
  return {
    minutes: item.timeEntries.reduce((sum, row) => sum + row.minutes, 0),
    productCount: item._count.productUsages,
  };
}
