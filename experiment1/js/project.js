// project.js - purpose and description here
// Author: Anthony Nguyen
// Date: 04/06/2025

// NOTE: This is how we might start a basic JavaaScript OOP project

// Constants - User-servicable parts
// In a longer project I like to put these in a separate file

// define a class
class MyProjectClass {
  // constructor function
  constructor(param1, param2) {
    // set properties using 'this' keyword
    this.property1 = param1;
    this.property2 = param2;
  }
  
  // define a method
  myMethod() {
    const fillers = {
      employee: ["CHEF", "You", "Person", "Customer", "Waiter", "Boss", "Homeless Man", "Intern", "Dog"],
      resturant: ["Thai Me Up", "Wok This Way", "Pho Me Up", "Kale Me Crazy"],
      location : ["hell", "heaven", "UCSC", "Merrill Acad 102", "Hell's Kitcen", "Space", "fridge", "Bank", ],
      ingredient: ["human meats", "garbages", "hell flames", "tears", "dark matters", "demons", "angel hairs", "planets", "pickle juice", "viles of god's blood", "interdemensional aliens"],
      item:["books", "swords", "magic gloves", "magical frying pans", "necklace of Josephs", "Godzilla pendant", "staff", "disabled women's wheel chair" ],
      num: ["2", "3", "11", "4", "5", "500","10","8","7","6","1000","0.5"],
      beast:["GODFREY", "Gordan Ramsay", "Dr.Doom", "DeadPool", "Itachi", "Jeff the Land Shark", "ChatGBT"],
      adverb: ["handsomely", "graciously", "nicely", "well", "lavishly", "considerately", "fairly", "decently"],
      loots: ["coins", "rocks", "cash", "resturant credits", "bananas", "gems","teeth", "grass", "good karma points", "bad karma points", "college credits"],
      message: ["help", "strength", "brain", "assistance", "eyes", "incompetence"],
      
    };
    
    const template = `WELCOME to the $resturant restaurant!
    
    $employee, my beloved establishment is facing a dire crisis. If we don’t act fast, we may be out of business for good. I need your $message to craft a brand-new recipe that could save us all. But the path ahead won’t be easy... Your journey will take you to $location, a place both wondrous and dangerous. There, hidden among the shadows, lie the precious items we need. But beware—the vile beast known only as $beast lurks there, guarding the ingredients with unrelenting fury.
    
    Here’s what I need from you:
    
    $num $ingredient
    
    $num $item
    
    $num $ingredient
    
    Should you return victorious, I shall reward you very $adverb in $loots. Good luck, the future depends on you.
    
    `;
    
    
    // STUDENTS: You don't need to edit code below this line.
    
    const slotPattern = /\$(\w+)/;
    
    function replacer(match, name) {
      let options = fillers[name];
      if (options) {
        return options[Math.floor(Math.random() * options.length)];
      } else {
        return `<UNKNOWN:${name}>`;
      }
    }
    
    function generate() {
      let story = template;
      while (story.match(slotPattern)) {
        story = story.replace(slotPattern, replacer);
      }
    
      const box = document.getElementById("box");
      if (box) {
        // replace newlines with <br> tags for HTML formatting
        box.innerHTML = story.replace(/\n/g, "<br>");
      }

    }
    
    /* global clicker */
    $("#clicker").click(generate);
    
    generate();
    
  }
}

function main() {
  // create an instance of the class
  let myInstance = new MyProjectClass("value1", "value2");

  // call a method on the instance
  myInstance.myMethod();
}

// let's get this party started - uncomment me
main();