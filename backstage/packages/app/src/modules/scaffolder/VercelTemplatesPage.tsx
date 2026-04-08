import { useState, useMemo, useCallback, useEffect } from 'react';
import { makeStyles, InputBase, Chip, Typography } from '@material-ui/core';
import SearchIcon from '@material-ui/icons/Search';
import { useNavigate } from 'react-router-dom';
import { useApi } from '@backstage/core-plugin-api';
import { catalogApiRef } from '@backstage/plugin-catalog-react';
import { Entity, stringifyEntityRef } from '@backstage/catalog-model';

const useStyles = makeStyles(theme => ({
  root: {
    minHeight: '100vh',
    background: theme.palette.type === 'dark' ? '#0a0a0a' : '#fafafa',
    padding: theme.spacing(6, 4),
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  header: {
    textAlign: 'center',
    marginBottom: theme.spacing(5),
  },
  title: {
    fontSize: '2.5rem',
    fontWeight: 700,
    color: theme.palette.type === 'dark' ? '#ededed' : '#171717',
    marginBottom: theme.spacing(1.5),
    letterSpacing: '-0.025em',
  },
  subtitle: {
    fontSize: '1rem',
    color: theme.palette.type === 'dark' ? '#a1a1a1' : '#666',
    maxWidth: 480,
    margin: '0 auto',
    lineHeight: 1.6,
  },
  searchWrapper: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: theme.spacing(5),
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    background: theme.palette.type === 'dark' ? '#1a1a1a' : '#fff',
    border: `1px solid ${
      theme.palette.type === 'dark' ? '#333' : '#e5e5e5'
    }`,
    borderRadius: 8,
    padding: theme.spacing(1, 2),
    width: '100%',
    maxWidth: 480,
    transition: 'border-color 0.2s, box-shadow 0.2s',
    '&:focus-within': {
      borderColor: theme.palette.type === 'dark' ? '#555' : '#999',
      boxShadow: `0 0 0 3px ${
        theme.palette.type === 'dark'
          ? 'rgba(255,255,255,0.06)'
          : 'rgba(0,0,0,0.04)'
      }`,
    },
  },
  searchIcon: {
    color: theme.palette.type === 'dark' ? '#666' : '#999',
    marginRight: theme.spacing(1),
    fontSize: 20,
  },
  searchInput: {
    flex: 1,
    fontSize: '0.938rem',
    color: theme.palette.type === 'dark' ? '#ededed' : '#171717',
    '&::placeholder': {
      color: theme.palette.type === 'dark' ? '#666' : '#999',
    },
  },
  layout: {
    display: 'flex',
    gap: theme.spacing(5),
    maxWidth: 1200,
    margin: '0 auto',
  },
  sidebar: {
    width: 200,
    flexShrink: 0,
    [theme.breakpoints.down('sm')]: {
      display: 'none',
    },
  },
  sidebarTitle: {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: theme.palette.type === 'dark' ? '#ededed' : '#171717',
    marginBottom: theme.spacing(2),
  },
  sidebarSectionTitle: {
    fontSize: '0.813rem',
    fontWeight: 600,
    color: theme.palette.type === 'dark' ? '#a1a1a1' : '#666',
    marginBottom: theme.spacing(1.5),
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    userSelect: 'none',
  },
  filterItem: {
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(0.5, 0),
    cursor: 'pointer',
    fontSize: '0.875rem',
    color: theme.palette.type === 'dark' ? '#a1a1a1' : '#666',
    transition: 'color 0.15s',
    '&:hover': {
      color: theme.palette.type === 'dark' ? '#ededed' : '#171717',
    },
  },
  filterItemActive: {
    color: theme.palette.type === 'dark' ? '#ededed' : '#171717',
    fontWeight: 500,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    border: `1.5px solid ${
      theme.palette.type === 'dark' ? '#444' : '#d4d4d4'
    }`,
    marginRight: theme.spacing(1),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'all 0.15s',
  },
  checkboxActive: {
    background: theme.palette.type === 'dark' ? '#ededed' : '#171717',
    borderColor: theme.palette.type === 'dark' ? '#ededed' : '#171717',
  },
  checkmark: {
    fontSize: 11,
    color: theme.palette.type === 'dark' ? '#0a0a0a' : '#fff',
    fontWeight: 700,
    lineHeight: 1,
  },
  grid: {
    flex: 1,
    display: 'grid',
    gap: theme.spacing(2.5),
    gridTemplateColumns: 'repeat(3, 1fr)',
    [theme.breakpoints.down('md')]: {
      gridTemplateColumns: 'repeat(2, 1fr)',
    },
    [theme.breakpoints.down('sm')]: {
      gridTemplateColumns: '1fr',
    },
  },
  card: {
    background: theme.palette.type === 'dark' ? '#1a1a1a' : '#fff',
    border: `1px solid ${
      theme.palette.type === 'dark' ? '#2a2a2a' : '#e5e5e5'
    }`,
    borderRadius: 12,
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.2s',
    '&:hover': {
      borderColor: theme.palette.type === 'dark' ? '#444' : '#ccc',
      boxShadow: `0 4px 12px ${
        theme.palette.type === 'dark'
          ? 'rgba(0,0,0,0.3)'
          : 'rgba(0,0,0,0.08)'
      }`,
      transform: 'translateY(-2px)',
    },
  },
  cardContent: {
    padding: theme.spacing(2.5),
  },
  cardTitle: {
    fontSize: '0.938rem',
    fontWeight: 600,
    color: theme.palette.type === 'dark' ? '#ededed' : '#171717',
    marginBottom: theme.spacing(0.75),
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
  },
  cardArrow: {
    fontSize: '0.75rem',
    opacity: 0.5,
  },
  cardDescription: {
    fontSize: '0.813rem',
    color: theme.palette.type === 'dark' ? '#888' : '#666',
    lineHeight: 1.5,
    marginBottom: theme.spacing(1.5),
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical' as const,
    overflow: 'hidden',
  },
  cardImage: {
    height: 160,
    background: theme.palette.type === 'dark' ? '#111' : '#f5f5f5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderTop: `1px solid ${
      theme.palette.type === 'dark' ? '#2a2a2a' : '#e5e5e5'
    }`,
    overflow: 'hidden',
  },
  cardImagePlaceholder: {
    fontSize: '2.5rem',
    opacity: 0.15,
    userSelect: 'none',
  },
  tags: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: theme.spacing(0.75),
    marginTop: theme.spacing(1),
  },
  tag: {
    fontSize: '0.688rem',
    fontWeight: 500,
    padding: theme.spacing(0.25, 1),
    borderRadius: 999,
    background: theme.palette.type === 'dark' ? '#262626' : '#f0f0f0',
    color: theme.palette.type === 'dark' ? '#a1a1a1' : '#666',
    border: 'none',
    height: 'auto',
  },
  emptyState: {
    gridColumn: '1 / -1',
    textAlign: 'center',
    padding: theme.spacing(8, 2),
    color: theme.palette.type === 'dark' ? '#666' : '#999',
  },
  emptyIcon: {
    fontSize: '3rem',
    marginBottom: theme.spacing(2),
    opacity: 0.3,
  },
  ownerChip: {
    fontSize: '0.688rem',
    fontWeight: 500,
    padding: theme.spacing(0.25, 1),
    borderRadius: 999,
    background: theme.palette.type === 'dark' ? '#1e293b' : '#e0f2fe',
    color: theme.palette.type === 'dark' ? '#7dd3fc' : '#0369a1',
    border: 'none',
    height: 'auto',
  },
  typeChip: {
    fontSize: '0.688rem',
    fontWeight: 500,
    padding: theme.spacing(0.25, 1),
    borderRadius: 999,
    background: theme.palette.type === 'dark' ? '#1a2e1a' : '#dcfce7',
    color: theme.palette.type === 'dark' ? '#86efac' : '#166534',
    border: 'none',
    height: 'auto',
  },
}));

const PLACEHOLDER_ICONS = [
  '\u{1F680}',
  '\u{26A1}',
  '\u{1F527}',
  '\u{1F4E6}',
  '\u{1F310}',
  '\u{1F3A8}',
  '\u{1F511}',
  '\u{1F4CA}',
];

export function VercelTemplatesPage() {
  const classes = useStyles();
  const navigate = useNavigate();
  const catalogApi = useApi(catalogApiRef);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [templates, setTemplates] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    catalogApi
      .getEntities({ filter: { kind: 'Template' } })
      .then(response => {
        if (!cancelled) {
          setTemplates(response.items);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [catalogApi]);

  const availableTypes = useMemo(() => {
    const types = new Set<string>();
    templates.forEach(t => {
      const specType = (t.spec as Record<string, unknown>)?.type;
      if (typeof specType === 'string') types.add(specType);
    });
    return Array.from(types).sort();
  }, [templates]);

  const filteredTemplates = useMemo(() => {
    return templates.filter(template => {
      const matchesSearch =
        !searchQuery ||
        template.metadata.title
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        template.metadata.description
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        template.metadata.name
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

      const specType = (template.spec as Record<string, unknown>)?.type;
      const matchesType =
        selectedTypes.length === 0 ||
        (typeof specType === 'string' && selectedTypes.includes(specType));

      return matchesSearch && matchesType;
    });
  }, [templates, searchQuery, selectedTypes]);

  const toggleType = useCallback((type: string) => {
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type],
    );
  }, []);

  const handleTemplateClick = useCallback(
    (template: { metadata: { namespace?: string; name: string } }) => {
      const namespace = template.metadata.namespace ?? 'default';
      const name = template.metadata.name;
      navigate(`${namespace}/${name}`);
    },
    [navigate],
  );

  return (
    <div className={classes.root}>
      <div className={classes.header}>
        <Typography className={classes.title} variant="h1">
          Find your Template
        </Typography>
        <Typography className={classes.subtitle}>
          Jumpstart your development process with pre-built templates from your
          organization and community.
        </Typography>
      </div>

      <div className={classes.searchWrapper}>
        <div className={classes.searchBox}>
          <SearchIcon className={classes.searchIcon} />
          <InputBase
            className={classes.searchInput}
            placeholder="Search templates..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            fullWidth
          />
        </div>
      </div>

      <div className={classes.layout}>
        <aside className={classes.sidebar}>
          <Typography className={classes.sidebarTitle}>
            Filter Templates
          </Typography>

          {availableTypes.length > 0 && (
            <div>
              <Typography className={classes.sidebarSectionTitle}>
                &#9662; Type
              </Typography>
              {availableTypes.map(type => {
                const isActive = selectedTypes.includes(type);
                return (
                  <div
                    key={type}
                    className={`${classes.filterItem} ${isActive ? classes.filterItemActive : ''}`}
                    onClick={() => toggleType(type)}
                    role="checkbox"
                    aria-checked={isActive}
                    tabIndex={0}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleType(type);
                      }
                    }}
                  >
                    <div
                      className={`${classes.checkbox} ${isActive ? classes.checkboxActive : ''}`}
                    >
                      {isActive && (
                        <span className={classes.checkmark}>&#10003;</span>
                      )}
                    </div>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </div>
                );
              })}
            </div>
          )}
        </aside>

        <div className={classes.grid}>
          {loading && (
            <div className={classes.emptyState}>
              <Typography>Loading templates...</Typography>
            </div>
          )}

          {!loading && filteredTemplates.length === 0 && (
            <div className={classes.emptyState}>
              <div className={classes.emptyIcon}>&#128269;</div>
              <Typography variant="h6" style={{ marginBottom: 8 }}>
                No templates found
              </Typography>
              <Typography variant="body2">
                Try adjusting your search or filter criteria
              </Typography>
            </div>
          )}

          {filteredTemplates.map((template, index) => {
            const spec = template.spec as Record<string, unknown>;
            return (
              <div
                key={stringifyEntityRef(template)}
                className={classes.card}
                onClick={() => handleTemplateClick(template)}
                role="button"
                tabIndex={0}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleTemplateClick(template);
                }}
              >
                <div className={classes.cardContent}>
                  <Typography className={classes.cardTitle}>
                    {template.metadata.title || template.metadata.name}
                    <span className={classes.cardArrow}>&#8599;</span>
                  </Typography>
                  {template.metadata.description && (
                    <Typography className={classes.cardDescription}>
                      {template.metadata.description}
                    </Typography>
                  )}
                  <div className={classes.tags}>
                    {typeof spec?.type === 'string' && (
                      <Chip
                        label={spec.type}
                        size="small"
                        className={classes.typeChip}
                      />
                    )}
                    {typeof spec?.owner === 'string' && (
                      <Chip
                        label={spec.owner.replace(/^user:/, '')}
                        size="small"
                        className={classes.ownerChip}
                      />
                    )}
                    {template.metadata.tags?.map(tag => (
                      <Chip
                        key={tag}
                        label={tag}
                        size="small"
                        className={classes.tag}
                      />
                    ))}
                  </div>
                </div>
                <div className={classes.cardImage}>
                  <span className={classes.cardImagePlaceholder}>
                    {PLACEHOLDER_ICONS[index % PLACEHOLDER_ICONS.length]}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
