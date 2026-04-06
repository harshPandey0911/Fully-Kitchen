export const adminUi = {
  page: 'space-y-6',
  pageHeader: 'flex flex-col gap-4 md:flex-row md:items-center md:justify-between',
  pageTitle: 'text-2xl font-semibold text-gray-900 md:text-3xl',
  pageDescription: 'text-sm text-gray-500',
  statsGrid: 'grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4',
  card: 'panel-hover-card rounded-lg border border-gray-200 bg-white p-5',
  cardTitle: 'text-sm text-gray-500',
  cardValue: 'mt-2 text-lg font-semibold text-gray-800',
  panel: 'panel-hover-surface overflow-hidden rounded-lg border border-gray-200 bg-white',
  panelHeader: 'flex flex-col gap-3 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between',
  panelTitle: 'text-sm font-semibold text-gray-900',
  sectionTitle: 'text-lg font-semibold text-gray-900',
  input: 'w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200',
  select: 'w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200',
  primaryButton: 'panel-hover-button-dark rounded-md bg-black px-4 py-2 text-sm text-white transition',
  secondaryButton: 'panel-hover-button-light rounded-md border border-gray-300 px-3 py-1 text-sm text-gray-700 transition',
  textButton: 'text-sm text-gray-700 transition hover:underline',
  tableHeader: 'bg-gray-50',
  th: 'px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500',
  td: 'px-5 py-4 text-sm text-gray-600',
  tableRow: 'panel-hover-row border-b border-gray-200 last:border-b-0',
  modalOverlay: 'fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4',
  modal: 'w-full max-w-md rounded-lg border border-gray-200 bg-white shadow-xl',
};

export const statusBadge = (status) => {
  switch (status) {
    case 'Approved':
    case 'Accepted':
    case 'Delivered':
    case 'Active':
    case 'Completed':
    case 'Enabled':
    case 'In Stock':
    case 'Low':
      return 'inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-600';
    case 'Pending':
    case 'Medium':
    case 'In Progress':
      return 'inline-flex rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-600';
    case 'Rejected':
    case 'Inactive':
    case 'Disabled':
    case 'High':
    case 'Low Stock':
      return 'inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-600';
    default:
      return 'inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600';
  }
};
