import EmptyState from '../components/common/EmptyState';

export default function ComingSoonPage({ module }) {
  return (
    <EmptyState
      title={`${module} — Coming in a later phase`}
      description="This module is planned but not yet implemented. Use the Dashboard for now."
      icon="🚧"
    />
  );
}
