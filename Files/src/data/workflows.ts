export const workflows = {
  species: {
    title: 'Species taxonomy workflow',
    description: 'Climate, land use and extinction-risk data train an AI prediction model. Planet ecological data queries the model and informs extinction risk. Composite plant stress levels feed two successive unsupervised k-means clustering stages, leading to species photocards.',
    width: 1500, height: 860,
  },
  masterplan: {
    title: 'Masterplan taxonomy workflow',
    description: 'Seed species and seedbank function relationships feed a graph-based algorithm and masterplan taxonomy. Context colour-field datasets feed a self-organising map. A branch from the graph output joins the resulting spatial field.',
    width: 1500, height: 990,
  },
};
