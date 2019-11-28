let Chef = require('./chef.js');
let Customer = require('./customer.js');
let Table = require('./table.js');
var Excel = require('excel4node');

var restaurant = function(minutes,customernum,tablenum,chefnum){
    //initialize chef and servers
    let customers = [], chefs = [],tables=[],two_tables = [], four_tables = [], six_tables = [], earnings = 0;
    initiate(chefs, tables,two_tables,four_tables,six_tables, tablenum, chefnum);
    //initialize simulation
    let two_table_queue = [],four_table_queue = [],six_table_queue = [],chef_queue = [],event = [];
    arrivals(event,minutes,customernum);
    while(event.length>0 && event[0].time<minutes){
        let curevent = event.shift();
        if(curevent.type == "arrival"){
            //add curevent to end of the table_queue
            if(curevent.customer.length<=2){
                two_table_queue.push(curevent.customer);
                for(let i =0; i<two_tables.length; i++){
                     if(two_tables[i].empty == true && two_table_queue.length>0){
                          cur_party = two_table_queue.shift();
                          two_tables[i].empty = false;
                          two_tables[i].customer = cur_party;
                          for(let j = 0; j<cur_party.length; j++){
                                let order = orderGenerater();
                                cur_party[j].order_name = Object.keys(order)[0];
                                cur_party[j].order_prep_time = order[Object.keys(order)[0]];
                                earnings += cur_party[j].order_prep_time;
                                cur_party[j].time_to_eat = Math.floor(Math.random() * 20);
                                cur_party[j].wait_for_table = curevent.time-cur_party[j].arrival;
                                cur_party[j].table = two_tables[i].id;
                                chef_queue.push(cur_party[j]);
                          }
                     }
                }
            }
            //check server availability
            else if(curevent.customer.length<=4 && curevent.customer.length>2){
                four_table_queue.push(curevent.customer);
                for(let i =0; i<four_tables.length; i++){
                     if(four_tables[i].empty && four_table_queue.length>0){
                          cur_party = four_table_queue.shift();
                          four_tables[i].empty = false;
                          four_tables[i].customer = cur_party;
                          for(let j = 0; j<cur_party.length; j++){
                                let order = orderGenerater();
                                cur_party[j].order_name = Object.keys(order)[0];
                                cur_party[j].order_prep_time = order[Object.keys(order)[0]];
                                earnings += cur_party[j].order_prep_time;
                                cur_party[j].time_to_eat = Math.floor(Math.random() * 20);
                                cur_party[j].wait_for_table = curevent.time-cur_party[j].arrival;
                                cur_party[j].table = four_tables[i].id;
                                chef_queue.push(cur_party[j]);
                          }
                     }
                }
            }
            else if(curevent.customer.length<=6 && curevent.customer.length>4){
                six_table_queue.push(curevent.customer);
                for(let i =0; i<six_tables.length; i++){
                     if(six_tables[i].empty && six_table_queue.length>0){
                          cur_party = six_table_queue.shift();
                          six_tables[i].empty = false;
                          six_tables[i].customer = cur_party;
                          for(let j = 0; j<cur_party.length; j++){
                                let order = orderGenerater();
                                cur_party[j].order_name = Object.keys(order)[0];
                                cur_party[j].order_prep_time = order[Object.keys(order)[0]];
                                earnings += cur_party[j].order_prep_time;
                                cur_party[j].time_to_eat = Math.floor(Math.random() * 20);
                                cur_party[j].wait_for_table = curevent.time-cur_party[j].arrival;
                                cur_party[j].table = six_tables[i].id;
                                chef_queue.push(cur_party[j]);
                          }
                     }
                }
            }
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
                if(tables[curevent.customer.table].seats==2 && two_table_queue.length>0){
                              cur_party = two_table_queue.shift();
                              tables[curevent.customer.table].empty = false;
                              tables[curevent.customer.table].customer = cur_party;
                              for(let j = 0; j<cur_party.length; j++){
                                    let order = orderGenerater();
                                    cur_party[j].order_name = Object.keys(order)[0];
                                    cur_party[j].order_prep_time = order[Object.keys(order)[0]];
                                    earnings += cur_party[j].order_prep_time;
                                    cur_party[j].time_to_eat = Math.floor(Math.random() * 20);
                                    cur_party[j].wait_for_table = curevent.time-cur_party[j].arrival;
                                    cur_party[j].table = tables[curevent.customer.table].id;
                                    chef_queue.push(cur_party[j]);
                              }
                }
                if(tables[curevent.customer.table].seats==4 && four_table_queue.length>0){
                              cur_party = four_table_queue.shift();
                              tables[curevent.customer.table].empty = false;
                              tables[curevent.customer.table].customer = cur_party;
                              for(let j = 0; j<cur_party.length; j++){
                                    let order = orderGenerater();
                                    cur_party[j].order_name = Object.keys(order)[0];
                                    cur_party[j].order_prep_time = order[Object.keys(order)[0]];
                                    earnings += cur_party[j].order_prep_time;
                                    cur_party[j].time_to_eat = Math.floor(Math.random() * 20);
                                    cur_party[j].wait_for_table = curevent.time-cur_party[j].arrival;
                                    cur_party[j].table = tables[curevent.customer.table].id;
                                    chef_queue.push(cur_party[j]);
                              }
                }
                if(tables[curevent.customer.table].seats==6 && six_table_queue.length>0){
                              cur_party = six_table_queue.shift();
                              tables[curevent.customer.table].empty = false;
                              tables[curevent.customer.table].customer = cur_party;
                              for(let j = 0; j<cur_party.length; j++){
                                    let order = orderGenerater();
                                    cur_party[j].order_name = Object.keys(order)[0];
                                    cur_party[j].order_prep_time = order[Object.keys(order)[0]];
                                    earnings += cur_party[j].order_prep_time;
                                    cur_party[j].time_to_eat = Math.floor(Math.random() * 20);
                                    cur_party[j].wait_for_table = curevent.time-cur_party[j].arrival;
                                    cur_party[j].table = tables[curevent.customer.table].id;
                                    chef_queue.push(cur_party[j]);
                              }
                }
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
        }
        event.sort((a,b) => {return a.time - b.time});
    }
    // console.log(customers,earnings);
    excel_export(customers);
};
var excel_export = function(customers){
  let workbook = new Excel.Workbook();
  let worksheet = workbook.addWorksheet('Sheet 1');
  var style = workbook.createStyle({
    font: {
      color: '#FF0800',
      size: 12
    },
    numberFormat: '$#,##0.00; ($#,##0.00); -'
  });
  for(let i =0; i<customers.length;i++){
      worksheet.cell(i+1,1).number(i+1).style(style);
      worksheet.cell(i+1,2).number(customers[i].arrival).style(style);
      worksheet.cell(i+1,3).number(customers[i].wait_for_table).style(style);
      worksheet.cell(i+1,4).number(customers[i].wait_for_dish).style(style);
      worksheet.cell(i+1,5).number(customers[i].time_to_eat).style(style);
      worksheet.cell(i+1,6).number(customers[i].finish_meal).style(style);
      worksheet.cell(i+1,7).number(customers[i].departure).style(style);
      worksheet.cell(i+1,8).string(customers[i].order_name).style(style);
      worksheet.cell(i+1,9).number(customers[i].order_prep_time).style(style);
      worksheet.cell(i+1,10).number(customers[i].chef).style(style);
      worksheet.cell(i+1,11).number(customers[i].table).style(style);
  }
  workbook.write('newexcel.xlsx');
}
var orderGenerater = function(){
    let menu = [{'Beef':10},{'Chicken':13},{'Fish':15},{'Lamb':10},{'Prawns':13},{'Vegetables':8}];
    let random = Math.random();
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
restaurant(600,200,[8,8,4],2);
