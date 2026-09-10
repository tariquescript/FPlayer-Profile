import { Link } from 'react-router-dom';
import { EmptyState } from '../components/States.jsx';
import { SearchIcon } from '../components/ui/Icons.jsx';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
      <EmptyState
        icon={<SearchIcon size={26} />}
        title="Page not found"
        message="That route does not exist. Head back to the search and look someone up."
        action={
          <Link to="/" className="btn btn-primary">
            Back to search
          </Link>
        }
      />
    </div>
  );
}
