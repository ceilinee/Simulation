var Table = function (id,seats) {
  this.id = id;
  this.customer=[];
  this.empty=true;
  this.seats=seats;
};

module.exports = Table;
