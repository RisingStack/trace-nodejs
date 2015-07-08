function send (data) {
  console.log(send);
}

function create (options) {


  return {
    send: send
  };
}

module.exports.create = create;
