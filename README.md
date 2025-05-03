# LA Wildfires

CMSC734 Final Project - LA Wildfires

__Datasets:__

[California Wildfire Damage (2014-(feb)2025)](https://www.kaggle.com/datasets/vivekattri/california-wildfire-damage-2014-feb2025?resource=download)

[The California Wildfire Data](https://www.kaggle.com/datasets/vijayveersingh/the-california-wildfire-data/data)

+ Original (updated) source: [CAL FIRE Damage Inspection (DINS) Data](https://data.cnra.ca.gov/dataset/cal-fire-damage-inspection-dins-data)
+ [DINS Database Dictionary](https://ago-item-storage.s3.amazonaws.com/db241103701846fa8c5b945cfeedda07/DINSDatabaseDictionary.pdf?X-Amz-Security-Token=IQoJb3JpZ2luX2VjEFwaCXVzLWVhc3QtMSJIMEYCIQClIwghf%2BkUWYsSdHLD90i9t1he1%2FjS2KisHeyuqkYvJwIhAPqWO7VGYlTXwJJYmWzGRrrUFuwAu5V%2B50o9tbbqaB%2F4KroFCPX%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEQABoMNjA0NzU4MTAyNjY1Igyx6wVg6AM7aJ8NpToqjgXQFIdRHfhf7FvSyzOE68EU88tKWwbapSPqpcgk9vQtT8AxylMT4kMButB5wSAHiKrCbwdWd7AHX9vYqDOXT25krXt4%2F%2B9EqUteexmzyYdRnz6dfxl5KzppXmNkdtolTiot01M3m9Ys1QiG1pHU6JxXJa%2F8RhJPjL6UoAjv0sxv7i91BOy%2FAr2V7O4AwF5abt64RqrMZk4jwzwPOTzKIP3LG%2FLD9zJARM9pBBI1Cfpvb1UJ%2Fd6oI8ksZl99Jzt%2FntzycMk0gmw0VDdK2POobg%2FC2skds5ugz63ssLzftAlKStNyfq9zH84wjP3SF9G1bP9cw8%2FUp7MQ5MQn1PGp0H5okO4eL9kcstUBE1PSN2kyO1yepsa0SjvJArXb0lURFf1fbDDxrrvBZvzam7nlbiGKqpgrWElEfK5DzuTm0MLdCySv7g8Rx%2FdCkNuESrfl8DcYfswvylLKnw5%2FdsrHTlCfnHfSM%2BxBwTbt3OEqfU6Puj0dxhorU9qPA1dRkQgPeNrLQY0j4jbiEYd9SXRzgXtOFR4Ruw%2BQMfFrLTB0SQXi8Xd726q%2FXbP9KBvAjAAuaLo0Nh34cFkLdHmy%2Bc0yaV8MfHgq5Tw4qADx99EwelmIxv7ePoEgSWFNlE19A%2Bep88ZVIp7RTqJ8j%2FCWA%2F1JW4SE%2FWMMnw9pkI4GGsYeFU2LhNHxq4VcGsbVAeFJVtBcCXvthzmv7ocszZfGEB8Jd8OhocrYwedzUy%2FKKKS2FAjDieqK7oMIU6cgGg%2Bhb9V63BIj2jXIupsWj%2BCcTkn%2Fa50oTc%2Fc7h0fVPVXKg1yBgeEmrW%2F0%2F6jFHySPbcl4L7C3hhy0DZa761UtYYxC9ijuAp3O5PgCpIKZJ2kcHe%2FT%2BowzePZwAY6sAHq4KFr%2BwKLopeKVgwmO1T3ymq2kL%2BGunybPBJnkkElxZhfoEM2yEz29IKSQ3rE1DEv3wNqRA0UpBFTdyEwLfhcFSOdyAHb1fEELQwHyOh5BjfwfgtbXmDzuHyG%2B%2BDb19wZEqOD6oPkFNv0nl%2BZD1n%2FGbRnrrQKLRqNQ9HEoWA9aCSoV5729EMMoR7pXPEFffLHpZx%2F34tSGE4sEd2znP60xn3LoLPvH98gttAzfO8VPw%3D%3D&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20250503T203014Z&X-Amz-SignedHeaders=host&X-Amz-Expires=300&X-Amz-Credential=ASIAYZTTEKKE6QYLC7DB%2F20250503%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Signature=6db6b52fca97c76d208c4d85736df1462c4a752176eb13a17f6a8ad24dcbda1e)

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