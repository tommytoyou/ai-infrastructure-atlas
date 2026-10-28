import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet.markercluster';
import { brand } from './config/brand';
import { locations, sources, evidenceConfig, statusConfig, type Location, type Evidence, type Status } from './data';

const ALL = 'All';

function markerIcon(loc: Location, selected = false) {
  const color = evidenceConfig[loc.evidence].color;
  return L.divIcon({
    className: 'atlas-marker-wrap',
    html: `<span class="atlas-marker ${selected ? 'is-selected' : ''}" style="--marker-color:${color}"></span>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

export default function App() {
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markers = useRef(new Map<string, L.Marker>());
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);
  const [query, setQuery] = useState('');
  const [evidence, setEvidence] = useState<string>(ALL);
  const [status, setStatus] = useState<string>(ALL);
  const [region, setRegion] = useState<string>(ALL);
  const [operator, setOperator] = useState<string>(ALL);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const operators = useMemo(() => [ALL, ...new Set(locations.map((l) => l.operator))], []);
  const regions = useMemo(() => [ALL, ...new Set(locations.map((l) => l.region))], []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return locations.filter(
      (l) =>
        (!q || [l.name, l.operator, l.city, l.country, l.region].join(' ').toLowerCase().includes(q)) &&
        (evidence === ALL || l.evidence === evidence) &&
        (status === ALL || l.status === status) &&
        (region === ALL || l.region === region) &&
        (operator === ALL || l.operator === operator),
    );
  }, [query, evidence, status, region, operator]);

  const selected = locations.find((l) => l.id === selectedId) || filtered[0] || locations[0];
  const operating = locations.filter((l) => l.status === 'Operating').length;
  const planned = locations.filter((l) => l.status === 'Planned').length;
  const countries = new Set(locations.map((l) => l.country)).size;

  useEffect(() => {
    if (!mapEl.current || mapRef.current) return;
    const map = L.map(mapEl.current, { worldCopyJump: true, zoomControl: false, minZoom: 2 }).setView([20, 12], 2);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri — Esri, DeLorme, NAVTEQ',
      maxZoom: 18,
    }).addTo(map);
    mapRef.current = map;
    (window as unknown as { __atlasMap: L.Map }).__atlasMap = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    clusterRef.current?.remove();
    markers.current.clear();
    const group = L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 42,
      disableClusteringAtZoom: 5,
      iconCreateFunction: (c) =>
        L.divIcon({ className: 'atlas-cluster-wrap', html: `<span class="atlas-cluster">${c.getChildCount()}</span>`, iconSize: [46, 46] }),
    });
    filtered.forEach((loc) => {
      const m = L.marker([loc.lat, loc.lng], { icon: markerIcon(loc, loc.id === selectedId) }).bindTooltip(
        `<strong>${loc.name}</strong><br/><span>${loc.operator} · ${loc.status}</span>`,
        { direction: 'top', offset: [0, -8], opacity: 0.95 },
      );
      m.on('click', () => {
        setSelectedId(loc.id);
        map.flyTo([loc.lat, loc.lng], Math.max(map.getZoom(), 4), { duration: 0.65 });
      });
      group.addLayer(m);
      markers.current.set(loc.id, m);
    });
    group.addTo(map);
    clusterRef.current = group;
    (window as unknown as { __atlasCluster: L.MarkerClusterGroup }).__atlasCluster = group;
  }, [filtered, selectedId]);

  useEffect(() => {
    if (!selected) return;
    markers.current.get(selected.id)?.setIcon(markerIcon(selected, true));
  }, [selected]);

  const selectFromList = (loc: Location) => {
    setSelectedId(loc.id);
    mapRef.current?.flyTo([loc.lat, loc.lng], 4, { duration: 0.65 });
  };
  const reset = () => {
    setQuery(''); setEvidence(ALL); setStatus(ALL); setRegion(ALL); setOperator(ALL);
  };
  const pad = (n: number) => n.toString().padStart(2, '0');
  const dcm = sources.find((s) => s.id === 'datacentermap')!;

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark"><span /><span /><span /></div>
          <div>
            <div className="eyebrow">{brand.eyebrow}</div>
            <h1>{brand.siteName}</h1>
          </div>
        </div>
        <div className="header-actions">
          <span className="live-chip"><i /> SOURCE-BACKED VIEW</span>
          <button className="methodology-button" onClick={() => setModalOpen(true)}>Methodology <span>↗</span></button>
        </div>
      </header>

      <main className="workspace">
        <section className="intro-row">
          <div>
            <p className="kicker">WHERE COMPUTE BECOMES INTELLIGENCE</p>
            <h2>A living atlas of the places that <em>make AI possible.</em></h2>
            <p className="intro-copy">Explore public, source-backed locations that host, support, or facilitate AI—from purpose-built GPU campuses to hyperscaler regions and emerging sites.</p>
          </div>
          <div className="scope-note">
            <span className="scope-dot" />
            <strong>Coverage is directional, not exhaustive.</strong>
            <br />
            Exact facility boundaries and workloads are often undisclosed.
          </div>
        </section>

        <section className="stats-strip" aria-label="Atlas statistics">
          <div className="stat"><span className="stat-label">MAPPED LOCATIONS</span><strong>{locations.length}</strong><span className="stat-sub">curated records</span></div>
          <div className="stat"><span className="stat-label">COUNTRIES</span><strong>{countries}</strong><span className="stat-sub">across {regions.length - 1} regions</span></div>
          <div className="stat"><span className="stat-label">OPERATING</span><strong>{operating}</strong><span className="stat-sub">publicly active</span></div>
          <div className="stat"><span className="stat-label">PLANNED / IN DEV.</span><strong>{planned}</strong><span className="stat-sub">future capacity</span></div>
          <div className="stat stat-source"><span className="stat-label">LAST UPDATED</span><strong>28.10.26</strong><span className="stat-sub">evidence refresh</span></div>
        </section>

        <section className="atlas-panel">
          <aside className="control-rail">
            <div className="rail-heading">
              <span>EXPLORE THE ATLAS</span>
              <span className="result-count">{pad(filtered.length)} / {pad(locations.length)}</span>
            </div>
            <label className="search-box">
              <span>⌕</span>
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search places, operators…" />
              <kbd>/</kbd>
            </label>
            <div className="filter-group">
              <span className="filter-label">EVIDENCE LEVEL</span>
              <div className="filter-pills">
                {[ALL, ...Object.keys(evidenceConfig)].map((e) => (
                  <button key={e} className={`pill ${evidence === e ? 'active' : ''}`} onClick={() => setEvidence(e)}>
                    {e !== ALL && <i style={{ background: evidenceConfig[e as Evidence].color }} />}
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <div className="filter-group">
              <span className="filter-label">OPERATING STATUS</span>
              <div className="filter-pills">
                {[ALL, ...Object.keys(statusConfig)].map((s) => (
                  <button key={s} className={`pill ${status === s ? 'active' : ''}`} onClick={() => setStatus(s)}>
                    {s !== ALL && <i style={{ background: statusConfig[s as Status].color }} />}
                    {s === 'Planned' ? 'Planned / in dev.' : s}
                  </button>
                ))}
              </div>
            </div>
            <div className="select-row">
              <label>REGION
                <select value={region} onChange={(e) => setRegion(e.target.value)}>
                  {regions.map((r) => <option key={r}>{r}</option>)}
                </select>
              </label>
              <label>OPERATOR
                <select value={operator} onChange={(e) => setOperator(e.target.value)}>
                  {operators.map((o) => <option key={o}>{o}</option>)}
                </select>
              </label>
            </div>
            <button className="reset-button" onClick={reset}>Reset filters <span>↗</span></button>
            <div className="legend">
              <span className="filter-label">HOW TO READ</span>
              {Object.entries(evidenceConfig).map(([k, v]) => (
                <div className="legend-row" key={k}>
                  <i style={{ background: v.color }} />
                  <span><strong>{k}</strong><small>{v.description}</small></span>
                </div>
              ))}
            </div>
            <div className="source-foot">
              Built from {sources.length} public source families
              <br />
              <a href={dcm.url} target="_blank" rel="noreferrer">Global directory context ↗</a>
            </div>
          </aside>

          <div className="map-stage">
            <div ref={mapEl} className="map-canvas" />
            <div className="map-overlay-top">
              <span><i className="pulse-dot" /> LIVE EXPLORATION</span>
              <span>ZOOM TO INSPECT</span>
            </div>
            <div className="map-overlay-bottom">
              <span>MAP TILES © ESRI</span>
              <span>{filtered.length} visible records</span>
            </div>
          </div>

          <aside className="detail-rail">
            <div className="detail-heading">
              <span>SELECTED NODE</span>
              <span className="node-index">{selected ? '01' : '--'}</span>
            </div>
            {selected ? (
              <div className="detail-card">
                <div className="detail-badge-row">
                  <span className="evidence-badge" style={{
                    color: evidenceConfig[selected.evidence].color,
                    borderColor: `${evidenceConfig[selected.evidence].color}55`,
                    background: `${evidenceConfig[selected.evidence].color}12`,
                  }}>{selected.evidence}</span>
                  <span className="status-badge"><i style={{ background: statusConfig[selected.status].color }} />{selected.status}</span>
                </div>
                <h3>{selected.name}</h3>
                <p className="operator-line">{selected.operator}</p>
                <div className="location-line">
                  <span>⌖</span>
                  <span>{selected.city}<br /><small>{selected.country} · {selected.region}</small></span>
                </div>
                <div className="detail-rule" />
                <span className="filter-label">ATLAS NOTE</span>
                <p className="detail-note">{selected.note}</p>
                <a className="source-link" href={selected.source.url} target="_blank" rel="noreferrer"><span>↗</span> Verify at {selected.source.label}</a>
              </div>
            ) : (
              <div className="empty-card">No location matches the current view.</div>
            )}
            <div className="nearby">
              <div className="nearby-heading"><span>VISIBLE LOCATIONS</span><span>{filtered.length}</span></div>
              <div className="nearby-list">
                {filtered.slice(0, 7).map((l) => (
                  <button key={l.id} className={`nearby-item ${selected?.id === l.id ? 'active' : ''}`} onClick={() => selectFromList(l)}>
                    <i style={{ background: evidenceConfig[l.evidence].color }} />
                    <span><strong>{l.name}</strong><small>{l.operator} · {l.country}</small></span>
                    <span className="arrow">↗</span>
                  </button>
                ))}
              </div>
              {filtered.length > 7 && <span className="list-more">+ {filtered.length - 7} more in current view</span>}
            </div>
          </aside>
        </section>
      </main>

      <footer className="footer">
        <span>{brand.siteName.toUpperCase()}</span>
        <span>PUBLIC DATA / EXPLICIT UNCERTAINTY / OCT 2026</span>
        <button onClick={() => setModalOpen(true)}>Read the inclusion standard ↗</button>
      </footer>

      {modalOpen && (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <section className="methodology-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-button" onClick={() => setModalOpen(false)}>×</button>
            <p className="kicker">THE INCLUSION STANDARD</p>
            <h2>Useful, source-backed, and honest about the gaps.</h2>
            <p>There is no single public registry of every facility that hosts AI. This atlas is therefore a living evidence layer—not a claim of exhaustive global coverage.</p>
            <div className="method-grid">
              <div><span className="filter-label">AI-NATIVE</span><p>Purpose-built or explicitly marketed for AI training, inference, or accelerated computing.</p></div>
              <div><span className="filter-label">AI-CAPABLE</span><p>Cloud or hyperscale infrastructure known to support AI, while the exact workload mix may be undisclosed.</p></div>
              <div><span className="filter-label">AI-ADJACENT</span><p>A relevant data center or campus with only indirect or emerging public evidence of AI linkage.</p></div>
              <div><span className="filter-label">LOCATION PRECISION</span><p>Provider regions may be shown at metro level. Markers are not a promise of a precise parcel boundary.</p></div>
            </div>
            <div className="modal-source-list">
              <span className="filter-label">SOURCE FAMILIES USED</span>
              {sources.slice(0, 6).map((s) => (
                <a key={s.id} href={s.url} target="_blank" rel="noreferrer"><span>{s.label}</span><small>{s.kind} ↗</small></a>
              ))}
            </div>
            <p className="modal-updated">Current seed dataset refreshed October 28, 2026. The next layer should add regional public records, operator disclosures, and independent verification without silently collapsing uncertainty.</p>
          </section>
        </div>
      )}
    </div>
  );
}
