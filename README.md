# LA Wildfires

CMSC734 Final Project - LA Wildfires

__Datasets:__

[California Wildfire Damage (2014-(feb)2025)](https://www.kaggle.com/datasets/vivekattri/california-wildfire-damage-2014-feb2025?resource=download)

[The California Wildfire Data](https://www.kaggle.com/datasets/vijayveersingh/the-california-wildfire-data/data)

+ Original (updated) source: [CAL FIRE Damage Inspection (DINS) Data](https://data.cnra.ca.gov/dataset/cal-fire-damage-inspection-dins-data)
+ [DINS Database Dictionary](DINSDatabaseDictionary.pdf)

## Questions Answered

1. Which attribute was most strongly correlated with whether a building burned down? Not easy bc you just have to click all the check boxes
2. What correlation exists between the building's age and whether or not it burned down? FAIL
3. Where are the most severely damaged structures located geographically? Trends like how close to the mountains
4. How does the distribution of structure types vary by incident?
5. What is the relationship between roof construction and damage severity?
6. How do different counties compare in terms of structure loss?
7. Are certain exterior siding types more vulnerable to fire damage?
8. How does the year built relate to damage across incidents? FAIL
9. What patterns exist between eaves type and structure survival?
10. How does the presence of attached fences affect damage outcomes?
11. Are there spatial clusters of high or low damage within incidents?
12. How does the distribution of damage types change over time?
13. What is the relationship between CALFIRE unit and structure outcomes?
14. How do patio covers or carports relate to fire damage?
15. Can we identify incidents with unusually high or low structure survival rates?

Kinsey
Whhich areas were destroyed and which areas weren't? (Why did individual houses not survive in areas that mostly survived and vice versa)

## Project Submission Details

### Topic
**California Wildfire Structure Damage Analysis and Visualization**

### Team Members
- Spencer Jenkins
- Vincent La
- Sambit Sahoo

### Project Overview
This project presents an interactive web-based visualization system designed to help users explore, analyze, and answer complex questions about buildings affected by recent California wildfires. The system integrates multiple coordinated views—including a map, parallel categories plot, and summary charts—allowing users to interactively filter, compare, and discover patterns in the structure damage data. The unified interface supports a range of analytical tasks, enabling users to investigate spatial, temporal, and categorical relationships in the data.

---

## User Tasks (Framed as Questions)

1. Which structure and environmental attributes are most strongly associated with buildings burning down?
2. How does the age of a building relate to its likelihood of burning down in different incidents?
3. Where are the most severely damaged structures located for each major wildfire incident?
4. How do structure types and roof constructions relate to damage outcomes across incidents?
5. Are there spatial or categorical clusters of high or low damage, and how do these patterns change across incidents and years?

*The above questions should be presented on a separate page from the answers in your PDF submission.*

---

## Ground Truth Answers (with Example Visualizations)

1. **Which structure and environmental attributes are most strongly associated with buildings burning down?**  
   *Answer:* The parallel categories plot and Cramér's V bar chart reveal that roof construction and exterior siding are highly correlated with damage outcomes. For example, structures with wood siding and unenclosed eaves show a higher proportion of complete destruction.  
   *[Insert screenshot of parallel categories plot and Cramér's V bar chart]*

2. **How does the age of a building relate to its likelihood of burning down in different incidents?**  
   *Answer:* The scatter plot and line chart indicate that older buildings, especially those built before 1980, are more likely to be completely destroyed, particularly in incidents such as the 2018 Camp Fire.  
   *[Insert screenshot of scatter/line chart filtered by incident]*

3. **Where are the most severely damaged structures located for each major wildfire incident?**  
   *Answer:* The map view, when filtered by incident and colored by damage, shows clusters of destroyed buildings in the wildland-urban interface, especially at the periphery of urban areas in incidents like Tubbs and Camp.  
   *[Insert screenshot of map with damage coloring for a major incident]*

4. **How do structure types and roof constructions relate to damage outcomes across incidents?**  
   *Answer:* The parallel categories plot demonstrates that single-family residences with asphalt roofs are less likely to be destroyed compared to those with wood shake roofs, across multiple incidents.  
   *[Insert screenshot of parallel categories plot with relevant axes selected]*

5. **Are there spatial or categorical clusters of high or low damage, and how do these patterns change across incidents and years?**  
   *Answer:* The map and pie chart reveal that certain counties and years (e.g., Butte County in 2018) experienced concentrated clusters of high damage, while other areas saw more mixed outcomes.  
   *[Insert screenshot of map and pie chart for selected county/year]*

---

## System Access

- **Live Web App:** <spencerrjenkins.github.io>
- **Source Code:** Included in this zip file under the `final` directory.
- **Dataset:** Download from [California Wildfire Damage (2014-(feb)2025)](https://www.kaggle.com/datasets/vivekattri/california-wildfire-damage-2014-feb2025?resource=download) or [CAL FIRE DINS Data](https://data.cnra.ca.gov/dataset/cal-fire-damage-inspection-dins-data)
- **Setup Instructions:** See the README section above for setup and run instructions.

---

## Demo Video

- **URL:** [Insert YouTube or Vimeo link here]

*The video demonstrates the system’s capabilities and user interface. It does not provide answers to the analysis questions.*

---

## Unified Interface and Interaction Design

- All visualizations (map, parallel categories, pie/line/bar charts) are presented in a single, unified web interface.
- Interactions such as filtering by incident, attribute selection, and map zoom/pan are coordinated across all views.
- No separate tabs or windows are used; all tasks are supported within the main dashboard.
- The interface is designed for smooth usability, with responsive layout and minimal scrolling required.

---

## Additional Notes

- If the dataset is too large to include, download links are provided above.
- All code and resources needed to run the app are included in the `final` directory.
- For any issues or questions, please contact [your contact info or GitHub].


Kinsey feedback:
move dropdown closer to map
get rid of line chart
Not clear that fires besides eaton and palisades are not 2025 
not easy to add up raw numbers on pie chart
Categorize incidents by year in dropdown

Remove fires with like 3-4 buildings burned downMake the comparison to historical fires clearer