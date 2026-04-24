import { synthesizeProduct } from './hooks/growth_engine';
const res = synthesizeProduct('Starship');
const cats = new Set();
const walk = (nodes) => {
  nodes.forEach(n => {
    cats.add(n.category);
    if (n.children) walk(n.children);
  });
};
walk(res.template.genealogy);
console.log("Categories found:", Array.from(cats));
