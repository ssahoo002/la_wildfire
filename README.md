# California Wildfire Structural Damage

**Team Members:** Spencer Jenkins, Vincent La, Sambit Sahoo

## Project Overview

In this project, we provide an analysis tool to find trends regarding the damage caused by California wildfires. Our data, from the CAL FIRE Damage Inspection (DINS) database, provides structural features, damage metrics, and financial assessments for buildings within 100 meters of a given wildfire. Our interface centers around a map interface implemented using Leaflet. The user can choose a fire to display data for, and then choose a building attribute to examine. The selected data in view on the map will also populate some auxiliary plots. These consist of a parallel categories plot useful for trends across attributes, a pie chart/bar chart to show the breakdown and counts for a selected attribute, a time series illustrating the fire’s progression, and a correlation bar chart showing which attributes show the strongest relationship with fire damage. Changing the map view automatically changes the data displayed in the auxiliary plots. Our visualization supports multiple modes of analysis, including geospatial, chronological, and attribute-by-attribute analysis. Our tool provides an intuitive and insightful resource to answer our original questions about wildfire damage, as well as many more, and would be a valuable addition to the toolbox of policymakers and wildfire researchers.

- **Visualization Link:** [https://ssahoo002.github.io/la_wildfire/final/](https://ssahoo002.github.io/la_wildfire/final/)
- **Video:** `la_wildfire_demo.mp4`

## Original Questions

- Were older structures more vulnerable to the wildfires than newer structures? How does this trend change based on physical locality?
- Were certain CAL FIRE units more effective in containing the spread of wildfires from year to year?
- How much did the value of structures within a given area change after being exposed to wildfires?
- Which fires were the most destructive by various metrics? Compare the 2025 Palisades and Eaton incidents?
- How does the damage from the January 2025 wildfires compare to previous years?

## Answers

1. We generally did not observe any strong trend between building age and fire damage. Correlation values between building age and building damage were generally below 0.15. However, within clusters of structures of a given incident, you can analyze trends regarding structure age. For example, this particular portion of destroyed structures in the 2025 Eaton wildfire mostly contains homes built before 1960.

2. We observed no strong correlation between structural damage and the CAL FIRE unit responsible for that structure. The correlation value for structural damage and CAL FIRE unit is typically below 0.2. For example, looking at the 2024 wildfires, neither the parallel categories plot nor the correlation calculation shows a strong correlation between damage and CAL FIRE units.

3. Our dataset includes an “Assessed Improved Value” attribute, which represents the county assessor’s determination of the real estate value of the development on a given property. We transform this data to obtain the “Financial Loss” attribute by multiplying the assessed improved value by the percent damaged.
Our visualization can output the total losses for the data displayed on the map. Using our program, our estimate for the total financial loss incurred by the Palisades fire is $3.8 billion, while the loss incurred by the Eaton fire is $1.6 billion, for a financial loss ratio of approximately 2.4 to 1. According to data presented by the LA Times, our determined ratio is approximately equal to the expert-determined ratio of around 2.8 to 1, or $22 billion from the Palisades fire and $7.8 billion from the Eaton fire. It is expected that our data would underreport the total damage figure as we are only considering real estate damage, and not environmental damage, infrastructure damage, commercial interruption, and so on; and our data does not include assessed values for many public structures and facilities such as schools.

4. The Eaton fire impacted more structures overall compared to the Palisades fire with 18,422 recorded data points versus 12,070. However, the Palisades fire was much more proportionally destructive. While the Eaton fire damaged or destroyed 10,528 structures, or 53% of structures in the affected area, the Palisades fire damaged or destroyed 7,808 structures, or 64.7% of structures in the affected area.

5. Comparing the two years through the “Select Year” dropdown, it is clear that the damage done in 2025 was far worse than in 2024. 2025 had more than 5x the number of affected structures, 53.3% of which were rated to be “Destroyed (>50%)”. In comparison, across all 2024 incidents, only 18.7% fell into that same damage category. Furthermore, using the Financial Loss tool, our program reports $5.4 billion in financial losses due to fire damages in 2025, compared to $222 million in damages for 2024 and $3.2 million in damages for 2023.
