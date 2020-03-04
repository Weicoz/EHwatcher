var base = require('scripts/base');
var api = require('scripts/api');

input_pw();
// api.viewList();
function input_pw() {
    $input.text({
        type: $kbType.number,
        placeholder: "Input a PW",
        handler: function (text) {
            if (text == '0083'){
                api.viewList();
            }else if(text == '1122'){
                input_pw();
            }
        }
    });
};






// api.getElist();


// data = await api.getEpage();
// console.log(data);

//新建JS类写法
// var ttt = new test("aaa");
// alert(ttt.msgdata(1,22));
// function test(msg){

//     //alert(msg);
//     var data = 100;
//     this.msgdata = function(x,y){
//         alert(data);
//         return x+y;
//     }

// }
