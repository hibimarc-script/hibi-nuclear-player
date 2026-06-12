import { createFileRoute } from '@tanstack/react-router';

import { TopArtistsView } from '../views/TopArtists';

export const Route = createFileRoute('/top-artists')({
  component: TopArtistsView,
});
