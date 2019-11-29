let Chef = require('./chef.js');
let Customer = require('./customer.js');
let Table = require('./table.js');
var Excel = require('excel4node');

var restaurant = function(minutes,customernum,tablenum,chefnum){
    //initialize chef and servers
    let customers = [], chefs = [],tables=[],two_tables = [], four_tables = [], six_tables = [], earnings = 0;
    //populates chefs, tables arrays with Chef and Table instances based on given values
    initiate(chefs, tables,two_tables,four_tables,six_tables, tablenum, chefnum);
    //initialize tables, chefs and events queues
    let two_table_queue = [],four_table_queue = [],six_table_queue = [],chef_queue = [],event = [];
    //generates an event list of customer arrivals
    arrivals(event,minutes,customernum);
    //continues through event list until simulation ends or event list is empty
    while(event.length>0 && event[0].time<minutes){
        //curevent is equal to the next occuring event
        let curevent = event.shift();
        //if the event type is an "arrival" event
        if(curevent.type == "arrival"){
            //assign queue and tables_array to the corresponding table size based on customer group size
            let queue = two_table_queue;
            let tables_array = two_tables;
            if(curevent.customer.length<=4 && curevent.customer.length>2){
                queue = four_table_queue;
                tables_array = four_tables;
            }
            else if(curevent.customer.length<=6 && curevent.customer.length>4){
                queue = six_table_queue;
                tables_array = six_tables;
            }
            //Seat the customers if a table is available, else join the queue
            seat_customer(curevent, queue,tables_array,'NULL',chef_queue);
            //Assign chefs to the orders if chefs are available, else join the queue
            assign_chef(curevent,chef_queue,chefs,event);
        }
        //if the event type is an "dish-complete" event
        else if(curevent.type == "dish-complete"){
            //update state of the chef
            chefs[curevent.chef].busy = false;
            curevent.customer.wait_for_dish = curevent.time - (curevent.customer.arrival + curevent.customer.wait_for_table);
            //add a new departure event to queue
            event.push({type:"departure", time:curevent.time+curevent.customer.time_to_eat, customer: curevent.customer})
            //Assign chefs to the other orders
            if(chef_queue.length>0){
               let curorder = chef_queue.shift();
               chefs[curevent.chef].busy = true;
               curorder.chef = chefs[curevent.chef].id;
               curorder.order_prep_time = curorder.order_prep_time*chefs[curorder.chef].inexperience
               event.push({type:"dish-complete", time:curevent.time+(curorder.order_prep_time), customer: curorder, chef:curevent.chef});
            }
        }
        //if the event type is an "departure" event
        else if(curevent.type == "departure"){
            //update customer's meal finish time
            curevent.customer.finish_meal = curevent.time;
            let finish = true;
            //check if other customers at the table are done
            for(let i = 0; i<tables[curevent.customer.table].customer.length; i++){
                if(tables[curevent.customer.table].customer[i].finish_meal==0){
                  finish = false;
                }
            }
            //if all are done
            if(finish){
                //update departure time for all, add to output
                for(let i = 0; i<tables[curevent.customer.table].customer.length; i++){
                    tables[curevent.customer.table].customer[i].departure=curevent.time;
                    customers.push(tables[curevent.customer.table].customer[i]);
                }
                //update table state
                tables[curevent.customer.table].customer = [];
                tables[curevent.customer.table].empty = true;
                //assign corresponding table queue to variable queue based of size of table
                let queue = two_table_queue;
                if(tables[curevent.customer.table].seats==4){
                    queue = four_table_queue;
                }
                else if(tables[curevent.customer.table].seats==6){
                    queue = six_table_queue;
                }
                //Seat a customer to the available table if a customer is available
                seat_customer(curevent, queue,tables,curevent.customer.table,chef_queue);
                //Assign chefs to the orders if chefs are available, else join the queue
                assign_chef(curevent,chef_queue,chefs,event);
            }
        }
        //sort events, make sure in logical order
        event.sort((a,b) => {return a.time - b.time});
    }
    //generate excel output file
    excel_export(customers);
};
var assign_chef = function(curevent,chef_queue,chefs,event){
  //Check if each chef is busy, if not, assign the next order from the queue to them, push event to event queue
  for(let i =0;i<chefs.length;i++){
    if(!chefs[i].busy && chef_queue.length>0){
       let curorder = chef_queue.shift();
       chefs[i].busy = true;
       curorder.chef = chefs[i].id;
       curorder.order_prep_time = curorder.order_prep_time*chefs[curorder.chef].inexperience;
       event.push({type:"dish-complete", time:curevent.time+curorder.order_prep_time, customer: curorder, chef:i});
    }
  }
}
var seat_customer = function(curevent, queue,tables_array,know_table,chef_queue){
  //Add current customer to corresponding queue
  queue.push(curevent.customer);
  //If we don't know which table is available
  if(know_table == 'NULL'){
    //Check all tables for availability
    for(let i =0; i<tables_array.length; i++){
         if(tables_array[i].empty && queue.length>0){
              cur_party = queue.shift();
              //update table state
              tables_array[i].empty = false;
              tables_array[i].customer = cur_party;
              //for each member of the customer party, generate their orders, update their states
              for(let j = 0; j<cur_party.length; j++){
                    //Call orderGenerator function to randomly generate an orrder based on our research
                    let order = orderGenerater();
                    //Update customer data
                    cur_party[j].order_name = Object.keys(order)[0];
                    cur_party[j].order_prep_time = order[Object.keys(order)[0]];
                    cur_party[j].time_to_eat = Math.floor(Math.random() * 20);
                    cur_party[j].wait_for_table = curevent.time-cur_party[j].arrival;
                    cur_party[j].table = tables_array[i].id;
                    //Save order to chef_queue
                    chef_queue.push(cur_party[j]);
              }
         }
      }
  }
  //Else if we know which table is available
  else{
      //if customers are waiting for a table of that size
      if(queue.length>0){
           cur_party = queue.shift();
           //update table state
           tables_array[know_table].empty = false;
           tables_array[know_table].customer = cur_party;
           //for each member of the customer party, generate their orders, update their states
           for(let j = 0; j<cur_party.length; j++){
                 let order = orderGenerater();
                 //Call orderGenerator function to randomly generate an orrder based on our research
                 //Update customer data
                 cur_party[j].order_name = Object.keys(order)[0];
                 cur_party[j].order_prep_time = order[Object.keys(order)[0]];
                 cur_party[j].time_to_eat = Math.floor(Math.random() * 20);
                 cur_party[j].wait_for_table = curevent.time-cur_party[j].arrival;
                 cur_party[j].table = tables_array[know_table].id;
                 //Save order to chef_queue
                 chef_queue.push(cur_party[j]);
           }
      }
  }
}
var excel_export = function(customers){
  //Save all output to an excel file
  let workbook = new Excel.Workbook();
  let worksheet = workbook.addWorksheet('Sheet 1');
  var style = workbook.createStyle({
    font: {
      color: '#FF0800',
      size: 12
    }
  });
  worksheet.cell(1,1).string("ID").style(style);
  worksheet.cell(1,2).string("Arrival").style(style);
  worksheet.cell(1,3).string("Wait_for_table").style(style);
  worksheet.cell(1,4).string("Wait_for_dish").style(style);
  worksheet.cell(1,5).string("Time_to_eat").style(style);
  worksheet.cell(1,6).string("Finish_meal").style(style);
  worksheet.cell(1,7).string("Departure").style(style);
  worksheet.cell(1,8).string("Order_name").style(style);
  worksheet.cell(1,9).string("Order_prep_time").style(style);
  worksheet.cell(1,10).string("Chef").style(style);
  worksheet.cell(1,11).string("Tables").style(style);
  for(let i =0; i<customers.length;i++){
      worksheet.cell(i+2,1).number(i+1).style(style);
      worksheet.cell(i+2,2).number(customers[i].arrival).style(style);
      worksheet.cell(i+2,3).number(customers[i].wait_for_table).style(style);
      worksheet.cell(i+2,4).number(customers[i].wait_for_dish).style(style);
      worksheet.cell(i+2,5).number(customers[i].time_to_eat).style(style);
      worksheet.cell(i+2,6).number(customers[i].finish_meal).style(style);
      worksheet.cell(i+2,7).number(customers[i].departure).style(style);
      worksheet.cell(i+2,8).string(customers[i].order_name).style(style);
      worksheet.cell(i+2,9).number(customers[i].order_prep_time).style(style);
      worksheet.cell(i+2,10).number(customers[i].chef).style(style);
      worksheet.cell(i+2,11).number(customers[i].table).style(style);
  }
  workbook.write('newexcel.xlsx');
}
var orderGenerater = function(){
    //Generate a rrarndom order based on our research of order probability
    let menu = [{'Beef':5},{'Chicken':7},{'Fish':8},{'Lamb':5},{'Prawns':7},{'Vegetables':4}];
    let random = Math.random();
    let serve_time = Math.random();
    if(random<0.3){
        return menu[0];
    }
    if(random<0.5){
        return menu[1];
    }
    if(random<0.6){
        return menu[2];
    }
    if(random<0.7){
        return menu[3];
    }
    if(random<0.8){
        return menu[4];
    }
    else{
        return menu[5];
    }
}
var arrivals = function(event,minutes,customernum){
    //Generate arrivals
    let curtime = 0;
    //While there are fewer customers than defined
    while(curtime<customernum){
        //Generate an arrival time, based on the normal distrirbution
        let nextArrivalTime = Math.floor(random_normal()*minutes);
        //Generate size of the party
        let randomArrival = random_arrival_count();
        let customer = [];
        //Initiate an new instance of the Customer class until the party is the size of randomArrival
        for(let i = 0; i<randomArrival; i++){
            customer[i] = new Customer(nextArrivalTime);
        }
        //Add arrival to queue
        let nextArrival = {type:"arrival", time:nextArrivalTime, customer: customer};
        event.push(nextArrival);
        //Update curtime
        curtime+=randomArrival;
    }
    //Sort all the arrival events
    event.sort((a,b) => {return a.time - b.time});
};
var random_arrival_count = function(){
    //Generate customer group size using researched probability
    let random = Math.random();
    if(random<=0.1){
      return 1;
    }
    if(random<=0.3){
      return 2;
    }
    if(random<=0.4){
      return 3;
    }
    if(random<=0.7){
      return 4;
    }
    if(random<=0.8){
      return 5;
    }
    else{
      return 6;
    }
}
var random_normal = function(){
    //generate a random value based on the normal distribution
    let u = 0, v = 0;
    while(u === 0){
        u = Math.random();
    }
    while(v === 0){
        v = Math.random();
    }
    let normal = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
    normal = normal / 10.0 + 0.5;
    if (normal > 1 || normal < 0){
        return random_normal();
    }
    return normal;
}
var initiate = function(chefs, tables,two_tables,four_tables,six_tables,tablenum, chefnum){
    //populates chefs, tables arrays with Chef and Table instances based on given values
    for(let i =0; i<chefnum; i++){
        chefs[i] = new Chef(i,1+(0.2*i));
    }
    let id = 0;
    for(let i =0; i<tablenum[0]; i++){
        two_tables[i] = new Table(id,2);
        tables[id] = two_tables[i];
        id++;
    }
    for(let i =0; i<tablenum[1]; i++){
        four_tables[i] = new Table(id,4);
        tables[id] = four_tables[i];
        id++;
    }
    for(let i =0; i<tablenum[2]; i++){
        six_tables[i] = new Table(id,6);
        tables[id] = six_tables[i];
        id++;
    }
}
//Call restaurarnt function
restaurant(400,150,[8,8,4],2);
//function parameters (in order): sim time, max customers, [two seat tables, 4 seat tables, 6 seat tables], chefs
