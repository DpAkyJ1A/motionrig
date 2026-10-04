import s from './Card.module.css';
import './card.rig';

const PLANS = [
  { name: 'Solo', price: 'Free' },
  { name: 'Studio', price: '$12' },
  { name: 'Team', price: '$40' },
];

export function Cards() {
  return (
    <ul className={s.cards} data-rig="card">
      {PLANS.map((plan) => (
        <li key={plan.name} className={s.card} tabIndex={0}>
          <span className={s.name}>{plan.name}</span>
          <span className={s.price}>{plan.price}</span>
        </li>
      ))}
    </ul>
  );
}
