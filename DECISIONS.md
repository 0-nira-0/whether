# How I built Whether

When I started building Whether, I ran into a few problems that shaped how the final
application looks and works. In this file I want to present the short version of how I
planned the work, used AI, made the main decisions and checked the result.

The brief left some questions open on purpose. When I found one, I wrote down the decision
I made and the assumption behind it. In a real project, these are the things I would first
discuss with a product manager.

## My own plan

I started by brainstorming the product on my own. One of my first practical steps was to
review the [Open Meteo APIs](https://open-meteo.com/en/docs) and make a few live requests. I
wanted to understand which weather, marine and location data was actually available before
deciding how the application should use it.

With that information, I wrote a short plan for the user flow, backend and scoring. I wanted
to understand the problem and form my own opinion before looking at how somebody else had
solved it.

Once the first plan was ready, I reviewed it with AI. I used the feedback to find weak
points, missing cases and assumptions I needed to check. Only after that did I look at
similar products and compare their decisions with mine.

[Bouldi](https://bouldi.app/) was my main product reference. I also reviewed
[Wyndo](https://wyndo.app) and [WanderCast](https://wandercast.io) to compare how similar
products present weather and activity recommendations. I liked the idea of choosing one
activity and then opening its forecast in detail. [Landfolk](https://landfolk.com/) was my
visual reference because its calm colours, typography and spacing felt right for a travel
product.

I took the strongest ideas from these products and learned from the problems I noticed in
them. I used both parts, what worked and what did not, to improve my original plan and make
better decisions for Whether.

## Decisions

The main technical question was how to turn several weather measurements into one score
without making it difficult for the user to understand what each factor means.

I used the general approach of the
[Holiday Climate Index](https://doi.org/10.3390/atmos7060080). Each weather factor gets its
own score, then the factors are combined by weight. A severe weather condition can also
limit the final result. For example, perfect temperature should not hide a thunderstorm and
still produce a good outdoor score.

I calibrated every threshold for an adult leisure traveller without specialist equipment
or local knowledge. I also labelled each threshold in the code as `Measured`, `Sourced` or
`Assumed`, so it is clear which numbers came from live tests, external research or my own
judgement.

I adapted the factors for each activity. Skiing uses snow, temperature, wind and clouds.
Surfing uses waves, swell period, wind and water temperature. Outdoor sightseeing focuses
on rain, temperature, wind and clouds. Indoor sightseeing has its own logic because it is
not simply the opposite of outdoor weather. Here, indoor means visiting places such as museums or shopping centres, not only staying at home. Light rain can make a museum more attractive, but a severe storm can make getting there difficult.

This model is a first version, not a scientifically exact answer. I checked it with very
different cities and adjusted it when a result clearly did not make sense. My goal was to
rank the week reasonably and make the score easy to explain.

One of the first strange results I wanted to avoid was surfing in Warsaw. Some comparable
applications can still show a score there. Even a low score suggests that surfing is a real
option, so I needed a separate answer for places where the activity cannot be scored.

I tested the [Open Meteo Marine API](https://open-meteo.com/en/docs/marine-weather-api) with
inland cities and coastal places. When the API does not return usable wave data, Whether
shows surfing as unavailable instead of giving it a zero. I only say that there is no
coastal water data. I do not make a bigger claim about beaches or local facilities that I
cannot verify.

Large lakes made this decision more interesting. Chicago returns real wave data, while some
other lakes do not. I decided not to build a complicated lake detector. If wave data exists,
the model scores it. During testing I found that a warm, calm lake day could still reach
about 40 because good wind and water temperature compensated for weak waves. I added two
explicit caps: wave height below 0.3 m and swell period up to 5 s. This keeps flat water and
short wind chop low, including Chicago around 15. That felt simpler and more honest than
guessing what type of water the API had found.

For surfing, I score wind strength only because I do not know the coastline orientation and
cannot reliably identify onshore or offshore wind. When a marine factor is missing, such as
water temperature for Lake Michigan, I remove it and recalculate the score using the
remaining factors. The interface tells the user when this happens.

With skiing I ran into the opposite location problem. A ski town can sit in a valley with
no snow, while the nearby hills are in much better condition. At first I thought the town
forecast would be enough. Then I tested six points within 5 km of Chamonix, Innsbruck and
Zakopane. The points reached different forecast cells at much higher elevations. After that
test, I decided that checking the nearby hills was worth adding to the forecast request.

If the town has snow, I score the town. I do not assume that a nearby hill is always better.
Only when the town is bare do I choose the snowiest nearby cell, and I keep that same cell
for the whole week so the seven days stay comparable.

I show only that the score comes from snow conditions in the hills within about 5 km and
include the elevation. I never show a direction or coordinates. This point is not presented
as a safe destination or a recommendation to go there. The application knows about weather,
but it does not know about lifts, pistes, access or terrain safety. The user still needs to
check the actual resort.

Place search shows the city, region and country because names such as Paris can have several
valid matches. When no place is found, I show a normal `not found` state instead of treating
it as a forecast error.

Units were another small problem that mattered more than I first expected. It is easy for
an interface to show Celsius in one place and Fahrenheit inside an explanation, or to mix
kilometres and miles (I noticed this problem in other weather applications). I kept one
metric representation in the API and added one conversion module in the browser. When the
user changes the system, every number and every sentence changes together without fetching
the forecast again. Simple, but useful :)

I also tried a few ways of showing the scoring curves. One version looked like a small
technical graph without enough context. Another could show a perfect factor next to a poor
final day score, which looked like two answers that disagreed.

I simplified it to the factor name, a coloured measured value and a short sentence that
explains where the value sits against the ideal range. The same data that calculates the
score also creates the explanation, so the text cannot quietly drift away from the
calculation.

I added the best day as a clear answer above the seven cards. The task asks which of the
next seven days is best, so I did not want the user to compare all the values manually.

I also kept `UNAVAILABLE` separate from zero. Zero means that the weather can be scored and
it is very poor. Unavailable means that the relevant marine or snow data is not there.

During implementation I first wrote the validation for external responses by hand. It
worked, but it quickly became a collection of small helpers that repeated the same idea on
the backend and frontend. I replaced it with [Zod](https://zod.dev/basics). The schemas
check the response at runtime and provide the TypeScript types, so the expected data has one
clear definition.

## How I used AI during development

After creating the first plan on my own, I continued planning with an AI agent and discussed
the possible solutions before starting the implementation. Once the direction was clear, I
split the implementation into small tasks and assigned them to agents.

When tasks were independent, I ran them in parallel with different agents. When one task
depended on the previous work, I assigned it to one agent and kept that part of the work
sequential. Once the task was complete, I reviewed the result, requested a refactor when
needed or approved it, and only then committed the change and moved to the next task. This
let the agents work quickly while I kept control of the sequence and the final decisions.

Tests made this workflow much more predictable. When the expected behaviour was clear, I
tried to write the test before or together with the implementation. AI works better when it
has a concrete result to satisfy, and I could review a small change with much more
confidence.

The tests cover score ranges, ordering, caps, unavailable states, response validation, unit
conversion and generated explanations. At the end I also tested the complete application
manually with Warsaw, Biarritz, Gdansk, Chicago, Chamonix, Queenstown and Bariloche.

I also stopped myself before going too far into rabbit holes. I did not add accounts,
favourites, maps, persistence, caching or a complex historical snow model. Some of
these ideas could improve a production version, but they were less important than finishing
and checking the core flow.

The most important thing is that Whether does its job. It gives the user the information
they need, shows the best day, explains the score and clearly says when it does not have
enough information to score an activity honestly.

## References

Product references: [Bouldi](https://bouldi.app/), [Wyndo](https://wyndo.app) and
[WanderCast](https://wandercast.io)

Visual reference: [Landfolk](https://landfolk.com/) and its
[design guidelines](https://design.landfolk.com/Landfolk_Design_Guidelines_v1.pdf)

Scoring approach: [Holiday Climate Index](https://doi.org/10.3390/atmos7060080)

Weather and marine data: [Open Meteo Forecast API](https://open-meteo.com/en/docs) and
[Open Meteo Marine API](https://open-meteo.com/en/docs/marine-weather-api)

Surfing factors: [Surf Forecast FAQ](https://www.surf-forecast.com/pages/faq) and
[SurferToday swell period guide](https://www.surfertoday.com/surfing/the-importance-of-swell-period-in-surfing)

Runtime validation: [Zod documentation](https://zod.dev/basics)
