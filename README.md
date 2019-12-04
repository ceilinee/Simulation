# Simulation
Simulating the operations of a restaurant

Setup: 
1. Download nodejs here: https://nodejs.org/en/
2. Navigate to the main repository and run the following commands on your terminal:
3. npm install excel4node
4. node restaurant
5. The code should run, and should output results into a new excel file called "MSCI333-Restaurant.xlsx"

To test different values: 
Locate the line where we call the restaurant function at the bottom of the restaurant.js file

It should follow the following: restaurant(simulation_time, max_customers, [number_of_2_seat_tables,number_of_4_seat_tables,number_of_6_seat_tables], number_of_chefs);

Save the file after you've made edits, and in terminal, run: node restaurant

The results in "MSCI333-Restaurant.xlsx" should update to show the newest run. 
