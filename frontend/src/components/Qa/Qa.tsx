import styles from './Qa.module.css';

const ROWS = [
  {
    question: 'What does the score mean?',
    answer:
      'A number from 0 to 100 for one activity on one day, from the weather alone: rain, temperature, wind and cloud, plus waves for surfing and snow for skiing. It says nothing about lifts, surf schools or opening hours.',
  },
  {
    question: 'How is it calculated?',
    answer:
      'Each factor is measured over the daytime, 08:00 to 20:00, and scored on a curve with an ideal range. The factor scores are combined by weight. A hard ceiling applies when one thing spoils the day on its own, such as a thunderstorm, strong gusts or a flat sea.',
  },
  {
    question: 'Where does the weather come from?',
    answer:
      'Open-Meteo, fetched live for every search and never stored. Surfing is scored at the nearest sea cell; skiing on the town if it has snow, otherwise on the snowiest point within about 5 km.',
  },
  {
    question: 'Why is an activity unavailable?',
    answer:
      'When there is nothing to score honestly: no coastal water near the place, or no snow this week. Unavailable is a state of its own, never a zero.',
  },
];

export function Qa() {
  return (
    <div className={styles.list}>
      {ROWS.map(({ question, answer }) => (
        <details key={question} className={styles.row}>
          <summary className={styles.question}>
            {question}
            <span className={styles.plus} aria-hidden="true">
              +
            </span>
          </summary>
          <p className={styles.answer}>{answer}</p>
        </details>
      ))}
    </div>
  );
}
