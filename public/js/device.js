var x=0;
var y=0;
dtr = ()=> {
     x=1;
      if(document.getElementById('imei').style.display=='none'){
        $("#btnsubmit").fadeIn("slow");
          $("#updateon").fadeIn("slow");
          $("#imei").fadeIn("slow");
           $("#deviceName").fadeIn("slow");
            $("#deviceModal").fadeIn("slow");
             $("#owner").fadeIn("slow");
              $("#comment").fadeIn("slow");
                 $("#updateon").fadeIn("slow");
                  $("#btnsubmit").fadeIn("slow");
                  $("#close").fadeIn("slow");
                  $("#edit").fadeOut("slow");
             
      }
      else{
         $("#close").fadeOut("slow");
          $("#edit").fadeIn("slow");
          $("#updateon").fadeOut("slow");
          $("#btnsubmit").fadeOut("slow");
          $("#imei").fadeOut("slow");
           $("#deviceName").fadeOut("slow");
            $("#deviceModal").fadeOut("slow");
             $("#owner").fadeOut("slow");
              $("#comment").fadeOut("slow");
      }
       return;
    }

    function reload(){
  // if(document.getElementById('imei').style.display!='none'){
  //  var xy = document.forms["myForm"]["imei"].value;
  //  if (xy == "") {
  //     return false;
  //  }
  // }

      if(window.location.href.search('allDevice')==-1){
       
      if(x==0){
          $("#close").fadeOut("slow");
          $("#edit").fadeIn("slow");
          $("#updateon").fadeOut("slow");
          $("#btnsubmit").fadeOut("slow");
          $("#imei").fadeOut("slow");
           $("#deviceName").fadeOut("slow");
            $("#deviceModal").fadeOut("slow");
             $("#owner").fadeOut("slow");
              $("#comment").fadeOut("slow");
              return;
        }
        else{
          x=0;
          return;
        }
        
      }
      else{
        alert(x);
        if(x==0){
          window.location.href=window.location.href.split('?')[0];
        }
        else{
          x=0;
          return;
        }
      }
     }

   