import { useState } from 'react';
import type { ActivityForecast } from '../../api/forecast';
import type { Place } from '../../api/places';
import { AnswerBlock } from '../AnswerBlock/AnswerBlock';
import { BestDayBanner } from '../BestDayBanner/BestDayBanner';
import { DayGrid } from '../DayGrid/DayGrid';
import styles from './Result.module.css';

export function Result({ place, forecast }: { place: Place; forecast: ActivityForecast }) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const best = forecast.days.find((day) => day.date === forecast.bestDay);
  const selected = forecast.days.find((day) => day.date === selectedDate) ?? forecast.days[0];
  if (best === undefined || selected === undefined) {
    return null;
  }
  return (
    <div className={styles.result}>
      <p className={styles.place}>
        {[place.name, place.region, place.country].filter(Boolean).join(', ')}
      </p>
      <BestDayBanner day={best} />
      <DayGrid days={forecast.days} selected={selected.date} onSelect={setSelectedDate} />
      <AnswerBlock day={selected} context={forecast.context} />
    </div>
  );
}
