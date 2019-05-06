// Initialize Firebase
var config = {
  //apiKey: "blah",
  authDomain: "parkinglot-237dc.firebaseapp.com",
  databaseURL: "https://parkinglot-237dc.firebaseio.com",
  projectId: "parkinglot-237dc",
  messagingSenderId: "418325293510"
};
firebase.initializeApp(config);

var db = firebase.firestore();
db.settings({
  timestampsInSnapshots: true
});

//send message to firestore
var message_field = document.getElementById("message");

var chatDisplay = document.getElementById("chat");

function send() {
  if (document.getElementById("message").value == "") {
    alert("Please fill in message field.")
  } else {
    chatDisplay.innerHTML = "";
    db.collection("messages").add({
        time: new Date(),
        message: message_field.value
      })
      .then(function(docRef) {
        console.log("Message written to database with the message:", document.getElementById("message").value);
      })
      .catch(function(error) {
        console.error("Error writing messag to database: ", error);
      });
    message_field.value = "";
  }
}

//retrieve new messages from firestore
db.collection("messages")
  .orderBy("time")
  .onSnapshot(function(querySnapshot) {
    chatDisplay.innerHTML = " ";
    querySnapshot.docChanges().forEach(function(change) {
      if (change.type === "added") {

        var full_date = change.doc.data().time.toDate();
        var date = full_date.toLocaleDateString();
        var time = full_date.toLocaleTimeString();
        var total_time = date + " " + time + ": ";
        var message = change.doc.data().message;
        chatDisplay.innerHTML += total_time.bold() + message + "<br>" + "<br>";
        chatDisplay.scrollTop = chatDisplay.scrollHeight;
      }
    });
  });

//Below is everything for updating and retrieving info from amazondb through
// the lambda functions using API gateway
var API_URL = 'https://axgnb3xqwk.execute-api.us-east-1.amazonaws.com/prod/';

$(document).ready(function() {
  $('#results').html('');
  $.ajax({
    type: 'GET',
    url: 'https://pzti1hd9hl.execute-api.us-east-1.amazonaws.com/default/FaaborgParkingLotsReadAll',
    success: function(data) {
      var results = [];
      data.Items.forEach(function(LotItem) {
        results.push({
          lot: LotItem.lot,
          spots: LotItem.spots
        });
      })

      results.sort(function(a, b) {
        return b.spots - a.spots;
      });
      results.forEach(function(Item) {
        $('#results').append('<p>' + "Lot:   ".bold() + Item.lot + '<br>' + "Available Spots:".bold() + Item.spots + '</p> ');
      });
    }
  });
});

$('#SubmitButton').on('click', function(e) {
  if (document.getElementById("lot").value == "" || document.getElementById("spot").value == "") {
    e.preventDefault();
    alert("Please fill in fields for Lot and Spots");

  } else if (document.getElementById("lot").value > 20 || document.getElementById("lot").value < 0) {
    e.preventDefault();
    alert("Lot number not in range");
  } else {
    e.preventDefault();
    $.ajax({
      type: 'POST',
      url: API_URL,
      data: JSON.stringify({
        "lot": document.getElementById("lot").value,
        "spots": document.getElementById("spot").value
      }),
      contentType: "application/json",
      success: function(response) {
        $.ajax({
          type: 'GET',
          url: 'https://pzti1hd9hl.execute-api.us-east-1.amazonaws.com/default/FaaborgParkingLotsReadAll',
          success: function(data) {
            $('#results').html('');
            var results = [];
            data.Items.forEach(function(LotItem) {
              results.push({
                lot: LotItem.lot,
                spots: LotItem.spots
              });
            })

            results.sort(function(a, b) {
              return b.spots - a.spots;
            });
            results.forEach(function(Item) {
              $('#results').append('<p>' + "Lot:   ".bold() + Item.lot + '<br>' + "Available Spots:".bold() + Item.spots + '</p> ');
            });
          }
        });
        $('#display').html("Loading...");
        var ln = document.getElementById("lot").value
        $.ajax({
          type: 'GET',
          url: 'https://krdw5iimoe.execute-api.us-east-1.amazonaws.com/default/FaaborgParkingLots?lot=' + ln,
          success: function(data) {
            $(document).ajaxStart(function() {
              $('#display').html("Loading...")
            }).ajaxStop(function() {
              document.getElementById("lot").value = '';
              document.getElementById("spot").value = '';
              $('#display').html('<p>' + "Updated Lot " + data.Item.lot +
                " to have " + data.Item.spots + " available spots" +
                '</p>');
            });
          }
        });
      },
      error: function(response) {
        console.log(JSON.stringify(response));
      }
    });
  }
});
