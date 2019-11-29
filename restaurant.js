let Chef = require('./chef.js');
let Customer = require('./customer.js');
let Table = require('./table.js');
var Excel = require('excel4node');

var restaurant = function(minutes,customernum,tablenum,chefnum){
    //initialize chef and servers
    let customers = [], chefs = [],tables=[],two_tables = [], four_tables = [], six_tables = [], earnings = 0;
    initiate(chefs, tables,two_tables,four_tables,six_tables, tablenum, chefnum);
    let two_table_queue = [],four_table_queue = [],six_table_queue = [],chef_queue = [],event = [];
    arrivals(event,minutes,customernum);
    while(event.length>0 && event[0].time<minutes){
        let curevent = event.shift();
        if(curevent.type == "arrival"){
            //add curevent to end of the table_queue
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
            seat_customer(curevent, queue,tables_array,'NULL',chef_queue);
            assign_chef(curevent,chef_queue,chefs,event);
        }
        else if(curevent.type == "dish-complete"){
            chefs[curevent.chef].busy = false;
            curevent.customer.wait_for_dish = curevent.time - (curevent.customer.arrival + curevent.customer.wait_for_table);
            event.push({type:"departure", time:curevent.time+curevent.customer.time_to_eat, customer: curevent.customer})
            if(chef_queue.length>0){
               let curorder = chef_queue.shift();
               chefs[curevent.chef].busy = true;
               curorder.chef = chefs[curevent.chef].id;
               curorder.order_prep_time = curorder.order_prep_time*chefs[curorder.chef].inexperience
               event.push({type:"dish-complete", time:curevent.time+(curorder.order_prep_time), customer: curorder, chef:curevent.chef});
            }
        }
        else if(curevent.type == "departure"){
            curevent.customer.finish_meal = curevent.time;
            let finish = true;
            // console.log("length:",tables[curevent.customer.table].customer);
            for(let i = 0; i<tables[curevent.customer.table].customer.length; i++){
                // console.log(tables[curevent.customer.table].customer[i].finish_meal);
                if(tables[curevent.customer.table].customer[i].finish_meal==0){
                  finish = false;
                }
            }
            // console.log("result",finish);
            if(finish){
                for(let i = 0; i<tables[curevent.customer.table].customer.length; i++){
                    tables[curevent.customer.table].customer[i].departure=curevent.time;
                    customers.push(tables[curevent.customer.table].customer[i]);
                }
                tables[curevent.customer.table].customer = [];
                tables[curevent.customer.table].empty = true;
                let queue = two_table_queue;
                if(tables[curevent.customer.table].seats==4){
                    queue = four_table_queue;
                }
                else if(tables[curevent.customer.table].seats==6){
                    queue = six_table_queue;
                }
                seat_customer(curevent, queue,tables,curevent.customer.table,chef_queue);
                assign_chef(curevent,chef_queue,chefs,event);
            }
        }
        event.sort((a,b) => {return a.time - b.time});
    }
    // console.log(customers,earnings);
    excel_export(customers);
};
var assign_chef = function(curevent,chef_queue,chefs,event){
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
  queue.push(curevent.customer);
  if(know_table == 'NULL'){
    console.log("NULL");
    for(let i =0; i<tables_array.length; i++){
         if(tables_array[i].empty && queue.length>0){
              cur_party = queue.shift();
              tables_array[i].empty = false;
              tables_array[i].customer = cur_party;
              for(let j = 0; j<cur_party.length; j++){
                    let order = orderGenerater();
                    console.log(Object.keys(order));
                    cur_party[j].order_name = Object.keys(order)[0];
                    cur_party[j].order_prep_time = order[Object.keys(order)[0]];
                    cur_party[j].time_to_eat = Math.floor(Math.random() * 20);
                    cur_party[j].wait_for_table = curevent.time-cur_party[j].arrival;
                    cur_party[j].table = tables_array[i].id;
                    chef_queue.push(cur_party[j]);
              }
         }
      }
  }
  else{
      if(queue.length>0){
           cur_party = queue.shift();
           tables_array[know_table].empty = false;
           tables_array[know_table].customer = cur_party;
           for(let j = 0; j<cur_party.length; j++){
                 let order = orderGenerater();
                 cur_party[j].order_name = Object.keys(order)[0];
                 cur_party[j].order_prep_time = order[Object.keys(order)[0]];
                 cur_party[j].time_to_eat = Math.floor(Math.random() * 20);
                 cur_party[j].wait_for_table = curevent.time-cur_party[j].arrival;
                 cur_party[j].table = tables_array[know_table].id;
                 chef_queue.push(cur_party[j]);
           }
      }
  }
}
var excel_export = function(customers){
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
    let curtime = 0;
    while(curtime<customernum){
        let nextArrivalTime = Math.floor(random_normal()*minutes);
        let randomArrival = random_arrival_count();
        let customer = [];
        for(let i = 0; i<randomArrival; i++){
            customer[i] = new Customer(nextArrivalTime);
        }
        let nextArrival = {type:"arrival", time:nextArrivalTime, customer: customer};
        event.push(nextArrival);
        curtime+=randomArrival;
    }
    event.sort((a,b) => {return a.time - b.time});
};
var random_arrival_count = function(){
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
restaurant(400,150,[8,8,4],2);
//sim time, max customers, [two seat tables, 4 seat tables, 6 seat tables], chefs
