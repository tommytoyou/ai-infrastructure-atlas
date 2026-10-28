import locationsRaw from './locations.json';
import sourcesRaw from './sources.json';

export type Source = { id: string; label: string; url: string; kind: string };
export type Evidence = 'AI-native' | 'AI-capable' | 'AI-adjacent';
export type Status = 'Operating' | 'Planned';
export type Location = {
  id: string; name: string; operator: string; city: string; country: string; region: string;
  lat: number; lng: number; evidence: Evidence; status: Status; note: string; sourceId: string;
  source: Source;
};

export const sources = sourcesRaw as Source[];
export const sourceById = (id: string) => sources.find((s) => s.id === id)!;
export const locations: Location[] = (locationsRaw as Omit<Location, 'source'>[]).map((l) => ({
  ...l,
  source: sourceById(l.sourceId),
}));

export const evidenceConfig: Record<Evidence, { color: string; description: string }> = {
  'AI-native': { color: '#ff7b68', description: 'Purpose-built or explicitly marketed for AI workloads.' },
  'AI-capable': { color: '#5ce1e6', description: 'Provider or operator infrastructure known to support AI, but not necessarily dedicated to it.' },
  'AI-adjacent': { color: '#a78bfa', description: 'Relevant data center or campus with public AI linkage still uncertain or indirect.' },
};
export const statusConfig: Record<Status, { color: string; description: string }> = {
  Operating: { color: '#60d394', description: 'Public source indicates active or operational infrastructure.' },
  Planned: { color: '#f5c451', description: 'Announced, contracted, in-development, or planned.' },
};
