import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  makeStyles,
  Paper,
  Typography,
} from '@material-ui/core';
import FlashOnIcon from '@material-ui/icons/FlashOn';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import VisibilityIcon from '@material-ui/icons/Visibility';
import { stringifyEntityRef } from '@backstage/catalog-model';
import { catalogApiRef } from '@backstage/plugin-catalog-react';
import { useApi } from '@backstage/frontend-plugin-api';
import { type TemplateListPageProps } from '@backstage/plugin-scaffolder/alpha';
import {
  type TemplateEntityV1beta3,
  isTemplateEntityV1beta3,
} from '@backstage/plugin-scaffolder-common';
import { TemplateCard } from '@backstage/plugin-scaffolder-react/alpha';

const useStyles = makeStyles(theme => ({
  root: {
    display: 'grid',
    gap: theme.spacing(3),
  },
  hero: {
    padding: theme.spacing(4),
    background: `linear-gradient(135deg, ${theme.palette.primary.light}22 0%, ${theme.palette.background.paper} 60%)`,
    border: `1px solid ${theme.palette.divider}`,
  },
  heroGrid: {
    alignItems: 'center',
  },
  eyebrow: {
    marginBottom: theme.spacing(1),
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    fontWeight: 700,
  },
  actionRow: {
    display: 'flex',
    gap: theme.spacing(1.5),
    flexWrap: 'wrap',
    marginTop: theme.spacing(3),
  },
  quickStats: {
    display: 'grid',
    gap: theme.spacing(1.5),
  },
  statCard: {
    padding: theme.spacing(2),
    minHeight: 104,
    border: `1px solid ${theme.palette.divider}`,
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing(2),
    marginBottom: theme.spacing(1.5),
  },
  templateRail: {
    display: 'grid',
    gap: theme.spacing(2),
  },
  templateCard: {
    cursor: 'pointer',
    border: `1px solid ${theme.palette.divider}`,
    transition: 'transform 120ms ease, border-color 120ms ease, box-shadow 120ms ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: theme.shadows[4],
    },
  },
  selectedTemplateCard: {
    borderColor: theme.palette.primary.main,
    boxShadow: `0 0 0 1px ${theme.palette.primary.main}`,
  },
  previewCard: {
    position: 'sticky',
    top: theme.spacing(3),
    border: `1px solid ${theme.palette.divider}`,
  },
  previewHeader: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    marginBottom: theme.spacing(2),
  },
  chipRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(1),
  },
  previewListDense: {
    paddingTop: 0,
    paddingBottom: 0,
  },
  livePreviewPanel: {
    padding: theme.spacing(2),
    backgroundColor: theme.palette.action.hover,
    borderRadius: theme.shape.borderRadius,
    marginTop: theme.spacing(2),
  },
  emptyState: {
    padding: theme.spacing(4),
    textAlign: 'center',
    border: `1px dashed ${theme.palette.divider}`,
    backgroundColor: theme.palette.action.hover,
  },
  loadingShell: {
    display: 'grid',
    gap: theme.spacing(2),
  },
}));

type TemplateParameterGroup = {
  title?: string;
  required?: string[];
  properties?: Record<string, unknown>;
};

function getParameterGroups(template?: TemplateEntityV1beta3): TemplateParameterGroup[] {
  if (!template?.spec.parameters) {
    return [];
  }

  return Array.isArray(template.spec.parameters)
    ? template.spec.parameters
    : [template.spec.parameters];
}

function getPropertyEntries(template?: TemplateEntityV1beta3) {
  return getParameterGroups(template).flatMap(group =>
    Object.entries(group.properties ?? {}).map(([name, schema]) => ({
      groupTitle: group.title ?? 'Inputs',
      name,
      title:
        typeof schema === 'object' && schema && 'title' in schema
          ? String(schema.title)
          : name,
      type:
        typeof schema === 'object' && schema && 'type' in schema
          ? String(schema.type)
          : 'value',
      description:
        typeof schema === 'object' && schema && 'description' in schema
          ? String(schema.description)
          : undefined,
      required: group.required?.includes(name) ?? false,
    })),
  );
}

function getTemplateDescription(template?: TemplateEntityV1beta3) {
  return (
    template?.metadata.description ??
    template?.spec.presentation?.description ??
    'Choose a template to inspect its inputs, workflow, and expected output.'
  );
}

function getTemplateTitle(template?: TemplateEntityV1beta3) {
  return template?.metadata.title ?? template?.metadata.name ?? 'Select a template';
}

function getTemplateId(template: TemplateEntityV1beta3) {
  return stringifyEntityRef({
    kind: template.kind,
    namespace: template.metadata.namespace ?? 'default',
    name: template.metadata.name,
  });
}

function formatGroupTitle(value: string) {
  if (!value) {
    return 'Available templates';
  }

  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map(part => part[0]?.toUpperCase() + part.slice(1))
    .join(' ');
}

export const CustomCreatePage = (props: TemplateListPageProps) => {
  const classes = useStyles();
  const navigate = useNavigate();
  const catalogApi = useApi(catalogApiRef);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [templates, setTemplates] = useState<TemplateEntityV1beta3[]>([]);
  const [selectedTemplateRef, setSelectedTemplateRef] = useState<string>();

  useEffect(() => {
    let active = true;

    async function loadTemplates() {
      setLoading(true);
      setError(undefined);

      try {
        const response = await catalogApi.getEntities({
          filter: { kind: 'Template' },
        });

        if (!active) {
          return;
        }

        const filtered = response.items
          .filter(isTemplateEntityV1beta3)
          .filter(template => props.templateFilter?.(template) ?? true)
          .sort((left, right) => {
            const leftTitle = left.metadata.title ?? left.metadata.name;
            const rightTitle = right.metadata.title ?? right.metadata.name;
            return leftTitle.localeCompare(rightTitle);
          });

        setTemplates(filtered);
        setSelectedTemplateRef(current =>
          current && filtered.some(item => getTemplateId(item) === current)
            ? current
            : filtered[0] && getTemplateId(filtered[0]),
        );
      } catch (e) {
        if (active) {
          setError(
            e instanceof Error ? e.message : 'Failed to load scaffolder templates',
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadTemplates();

    return () => {
      active = false;
    };
  }, [catalogApi, props.templateFilter]);

  const selectedTemplate = useMemo(
    () => templates.find(template => getTemplateId(template) === selectedTemplateRef),
    [selectedTemplateRef, templates],
  );

  const parameterEntries = useMemo(
    () => getPropertyEntries(selectedTemplate),
    [selectedTemplate],
  );

  const groupedTemplates = useMemo(() => {
    const groups = new Map<string, TemplateEntityV1beta3[]>();

    for (const template of templates) {
      const key = template.spec.type ?? 'other';
      groups.set(key, [...(groups.get(key) ?? []), template]);
    }

    if (groups.size <= 1) {
      return [
        {
          title: 'Available templates',
          templates,
        },
      ].filter(group => group.templates.length > 0);
    }

    return Array.from(groups.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([type, grouped]) => ({
        title: formatGroupTitle(type),
        templates: grouped,
      }));
  }, [templates]);

  const launchSelectedTemplate = () => {
    if (!selectedTemplate) {
      return;
    }

    navigate(
      `templates/${selectedTemplate.metadata.namespace ?? 'default'}/${
        selectedTemplate.metadata.name
      }`,
    );
  };

  return (
    <div className={classes.root}>
      <Paper className={classes.hero} elevation={0}>
        <Grid container spacing={4} className={classes.heroGrid}>
          <Grid item xs={12} md={8}>
            <Typography variant="overline" color="primary" className={classes.eyebrow}>
              Create page POC
            </Typography>
            <Typography variant="h3" gutterBottom>
              A more engaging create experience for Backstage
            </Typography>
            <Typography variant="body1" color="textSecondary">
              This proof of concept turns the default scaffolder landing page into a
              richer discovery surface. Users can browse templates, inspect the input
              model, and preview the workflow before they launch the wizard.
            </Typography>
            <Box className={classes.actionRow}>
              <Button
                color="primary"
                variant="contained"
                startIcon={<PlayArrowIcon />}
                onClick={launchSelectedTemplate}
                disabled={!selectedTemplate}
              >
                Start selected template
              </Button>
              <Button
                color="primary"
                variant="outlined"
                startIcon={<VisibilityIcon />}
                onClick={() => {
                  const firstTemplate = templates[0];
                  if (!firstTemplate) {
                    return;
                  }
                  setSelectedTemplateRef(getTemplateId(firstTemplate));
                }}
                disabled={templates.length === 0}
              >
                Preview first template
              </Button>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <div className={classes.quickStats}>
              <Paper className={classes.statCard} elevation={0}>
                <Typography variant="overline" color="textSecondary">
                  Templates loaded
                </Typography>
                <Typography variant="h4">{templates.length}</Typography>
                <Typography variant="body2" color="textSecondary">
                  Pulled live from the catalog, so this view evolves with your real
                  template inventory.
                </Typography>
              </Paper>
              <Paper className={classes.statCard} elevation={0}>
                <Typography variant="overline" color="textSecondary">
                  Preview signal
                </Typography>
                <Typography variant="h4">
                  {selectedTemplate ? getParameterGroups(selectedTemplate).length : 0}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Parameter groups surfaced immediately to help users understand the
                  journey before they commit to the wizard.
                </Typography>
              </Paper>
            </div>
          </Grid>
        </Grid>
      </Paper>

      {loading ? (
        <Paper elevation={0} className={classes.loadingShell}>
          <LinearProgress />
          <Typography variant="body2" color="textSecondary">
            Loading templates and preparing the preview surface...
          </Typography>
        </Paper>
      ) : null}

      {error ? (
        <Paper className={classes.emptyState} elevation={0}>
          <Typography variant="h6" gutterBottom>
            Template preview is unavailable
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {error}
          </Typography>
        </Paper>
      ) : null}

      {!loading && !error ? (
        <Grid container spacing={3}>
          <Grid item xs={12} lg={7}>
            <div className={classes.sectionHeader}>
              <div>
                <Typography variant="h5">Template discovery</Typography>
                <Typography variant="body2" color="textSecondary">
                  This area is intentionally more editorial than the stock create page.
                  It is a practical example of how to reshape an existing Backstage
                  route with a custom module.
                </Typography>
              </div>
            </div>

            <div className={classes.templateRail}>
              {groupedTemplates.map(group => (
                <Card key={group.title} variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {group.title}
                    </Typography>
                    <Grid container spacing={2}>
                      {group.templates.map(template => {
                        const templateId = getTemplateId(template);
                        const isSelected = templateId === selectedTemplateRef;

                        return (
                          <Grid item xs={12} md={6} key={templateId}>
                            <div
                              className={`${classes.templateCard} ${
                                isSelected ? classes.selectedTemplateCard : ''
                              }`}
                              role="button"
                              tabIndex={0}
                              onClick={() => setSelectedTemplateRef(templateId)}
                              onKeyDown={event => {
                                if (event.key === 'Enter' || event.key === ' ') {
                                  event.preventDefault();
                                  setSelectedTemplateRef(templateId);
                                }
                              }}
                            >
                              <TemplateCard template={template} />
                            </div>
                          </Grid>
                        );
                      })}
                    </Grid>
                  </CardContent>
                </Card>
              ))}

              {groupedTemplates.length === 0 ? (
                <Paper className={classes.emptyState} elevation={0}>
                  <Typography variant="h6" gutterBottom>
                    No templates are available yet
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Add templates to the catalog and this create-page preview will
                    automatically start reflecting them.
                  </Typography>
                </Paper>
              ) : null}
            </div>
          </Grid>

          <Grid item xs={12} lg={5}>
            <Card className={classes.previewCard} variant="outlined">
              <CardContent>
                <div className={classes.previewHeader}>
                  <Typography variant="overline" color="primary">
                    Live preview
                  </Typography>
                  <Typography variant="h5">{getTemplateTitle(selectedTemplate)}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {getTemplateDescription(selectedTemplate)}
                  </Typography>
                </div>

                {selectedTemplate ? (
                  <>
                    <div className={classes.chipRow}>
                      <Chip
                        label={`Type: ${selectedTemplate.spec.type ?? 'unknown'}`}
                        size="small"
                        color="primary"
                      />
                      <Chip
                        label={`Owner: ${selectedTemplate.spec.owner ?? 'unassigned'}`}
                        size="small"
                      />
                      <Chip
                        label={`${selectedTemplate.spec.steps.length} backend steps`}
                        size="small"
                      />
                    </div>

                    <div className={classes.livePreviewPanel}>
                      <Box display="flex" alignItems="center" gridGap={8} mb={1}>
                        <FlashOnIcon color="primary" fontSize="small" />
                        <Typography variant="subtitle1">
                          What users will experience
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="textSecondary">
                        The selected template asks for {parameterEntries.length}{' '}
                        configurable input
                        {parameterEntries.length === 1 ? '' : 's'} across{' '}
                        {getParameterGroups(selectedTemplate).length} form stage
                        {getParameterGroups(selectedTemplate).length === 1 ? '' : 's'},
                        then runs {selectedTemplate.spec.steps.length} scaffolder step
                        {selectedTemplate.spec.steps.length === 1 ? '' : 's'}.
                      </Typography>
                    </div>

                    <Box mt={3}>
                      <Typography variant="subtitle1" gutterBottom>
                        Input highlights
                      </Typography>
                      <List dense className={classes.previewListDense}>
                        {parameterEntries.slice(0, 6).map(input => (
                          <ListItem key={`${input.groupTitle}-${input.name}`} divider>
                            <ListItemText
                              primary={`${input.title}${input.required ? ' *' : ''}`}
                              secondary={`${input.groupTitle} · ${input.type}${
                                input.description ? ` · ${input.description}` : ''
                              }`}
                            />
                          </ListItem>
                        ))}
                        {parameterEntries.length === 0 ? (
                          <ListItem>
                            <ListItemText secondary="This template does not declare form parameters." />
                          </ListItem>
                        ) : null}
                      </List>
                    </Box>

                    <Divider />

                    <Box mt={2}>
                      <Typography variant="subtitle1" gutterBottom>
                        Workflow steps
                      </Typography>
                      <List dense className={classes.previewListDense}>
                        {selectedTemplate.spec.steps.map(step => (
                          <ListItem key={step.id} divider>
                            <ListItemText
                              primary={step.name ?? step.id}
                              secondary={`Action: ${step.action}`}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Box>

                    <Box mt={3}>
                      <Button
                        fullWidth
                        color="primary"
                        variant="contained"
                        startIcon={<PlayArrowIcon />}
                        onClick={launchSelectedTemplate}
                      >
                        Open wizard for {selectedTemplate.metadata.name}
                      </Button>
                    </Box>
                  </>
                ) : (
                  <Paper className={classes.emptyState} elevation={0}>
                    <Typography variant="body1">
                      Select a template card to populate the live preview.
                    </Typography>
                  </Paper>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      ) : null}
    </div>
  );
};
