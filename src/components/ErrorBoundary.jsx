import { Component } from 'react';
import { ErrorState } from './States.jsx';

/** Keeps one broken section from taking down the whole page. */
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Render error', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <ErrorState
            error={this.state.error}
            title="This view crashed"
            onRetry={() => this.setState({ error: null })}
          />
        </div>
      );
    }
    return this.props.children;
  }
}
