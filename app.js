/***************** NOTES ***************/

// [type] indicates income or expense 



/***************** BUDGET CONTROLLER module (IIFE that returns an object) (completely independent from other modules) *****************/

var budgetController = (function() { //aka budgetCtlr
    
    var Expense = function(id, description, value) {
        this.id = id;
        this.description = description;
        this.value = value;
        this.percentage = -1; // initializes the percentage method to -1
    }; 

    Expense.prototype.calcPercentage = function(totalIncome) { // adding a method to the Expense function constructor to calculate the percentage
        if (totalIncome > 0) {
            this.percentage = Math.round((this.value / totalIncome) * 100);
        } else {
            this.percentage = -1;
        }
    };

    Expense.prototype.getPercentage = function() { // gets the percentage 
        return this.percentage;
    };

    var Income = function(id, description, value) {
        this.id = id;
        this.description = description;
        this.value = value;
    }; 

    var calculateTotal = function(type) { // loops over the current value to add to the sum
        /* example of how this loop works 
        sum starts at 0
        example array [200, 400, 100]
        sum = 0 + 200
        sum = 200 + 400
        sum = 600 + 100 = 700 */ 
        var sum = 0;
        data.allItems[type].forEach(function(cur) {
            sum+= + cur.value;
        });
        data.totals[type] = sum; //added to our global data structure (var data object - below)
    };

    var data = {
        allItems: {
            exp: [],
            inc: []
        },
        totals: {
            exp: 0,
            inc: 0
        }, 
        budget: 0, 
        percentage: -1 // -1 indicates that something is not existant. If there are no budget items, we can't have a %
    };

    return { // allows other modules access 
        addItem: function(type, des, val) {
            var newItem, ID;

            // Create new ID
            if (data.allItems[type].length > 0) { // allows id to initialize even with no inputted data (sets it to 0)
                ID = data.allItems[type][data.allItems[type].length - 1].id + 1;  // allows us to access the location of the last array item, +1 gives us the array location/ aka id for an added item (important in case the array is out of order due to deletions [1 2 3 6 8])
            } else {
                ID = 0;
            }

            // Create new item based on the 'inc' or 'exp' type 
            if (type === 'exp') {
                newItem = new Expense(ID, des, val);
            } else if (type === 'inc') {
                newItem = new Income(ID, des, val);
            }
             
            // Push it into our data structure 
            data.allItems[type].push(newItem); //will select either the inc or exp array from the allItems object, and add newItem to the array

            // Return the new element 
            return newItem;
        },

        deleteItem: function(type, id) {
            var ids, index;
            // must keep in mind that elements in the array might be out of order due to deletions 
            // we need to find the index location of the id, rather than targeting the actual id 

            ids = data.allItems[type].map(function(current) { //map method returns a new array 
                return current.id; 
            });

            index = ids.indexOf(id); // find the index of the array id 

            if (index !== -1) {
                data.allItems[type].splice(index, 1); // index = the location of the items we want to delete/splice from the array; 1 = the number of elements we want to delete/splice 
            }
        },

        calculateBudget: function() {
            // Calculate total income and expenses 
            calculateTotal('exp');
            calculateTotal('inc');

            // Calculate the budget: income - expenses 
            data.budget = data.totals.inc - data.totals.exp;

            // Calculate the percentage of income that we spent 
            // only calculates a percentage if the budget is over 0 (i.e., the income to expense ratio is over 0) 
            if (data.totals.inc > 0) {
                data.percentage = Math.round((data.totals.exp / data.totals.inc) * 100); //rounds to closest integer 
            } else {
                data.percentage = -1; // aka non existant 
            }  
        },

        calculatePercentages: function() {
            data.allItems.exp.forEach(function(cur) { //forEach calls a function once for each element in the array, in order. Accesses the first/current variable 
                cur.calcPercentage(data.totals.inc); //calculates the percentage 
            }); 
        }, 

        getPercentages: function() {
            var allPerc = data.allItems.exp.map(function(cur){ // allPerc is an array with all the percentages 
                return cur.getPercentage(); 
            });
            return allPerc; //return the array with all percentages
        },

        getBudget: function() { // returns the budget 
            return {
                budget: data.budget, 
                totalInc: data.totals.inc, 
                totalExp: data.totals.exp, 
                percentage: data.percentage  
            };
        },

        testing: function() {
            console.log(data);
        }
    };


})();




/***************** UI CONTOLLER module (IIFE) (completely independent from other modules) *********************************************/

var UIController = (function() { // aka UICtrl 
    
    // stores the DOM strings so we can change them later if needed 
    var DOMStrings = {
        inputType: '.add__type', 
        inputDescription: '.add__description',
        inputValue: '.add__value', 
        inputBtn: '.add__btn', 
        incomeContainer: '.income__list',
        expensesContainer: '.expenses__list', 
        budgetLabel: '.budget__value', 
        incomeLabel: '.budget__income--value', 
        expensesLabel: '.budget__expenses--value', 
        percentageLabel: '.budget__expenses--percentage', 
        container: '.container', 
        expensesPercLabel: '.item__percentage', 
        dateLabel: '.budget__title--month'
    };

    var formatNumber = function(num, type) {
        var numSplit, int, dec;

        // 1. Make each income or expense item exactly two decimals 
        num = Math.abs(num); //abs returns absolute value of the number 
        num = num.toFixed(2); // when a method is applied to a primitive, JS automatically coverts it to an object. toFixed method puts exactly 2 decimals on the number being called 

        // 2. Add a comma seperating the thousands 
        numSplit = num.split('.'); //divides the number into the integar and the decimal and stores it in an array (which we access by index below )

        int = numSplit[0];
        if (int.length > 3) { //split results in a string, so we can access the length of the string 
            int = int.substr(0, int.length - 3) + ',' + int.substr(int.length - 3, 3); //substr allows us to extract part of a string (position to start at, how many elements to read) Ex: input 22310, output 22,310
        } 

        // 3. Add a + or - before each income or expense 
        dec = numSplit[1];
        return (type === 'exp' ? '-' : '+') + ' ' + int + '.' + dec; 
    };

    var nodeListForEach = function(list, callback) { //defines function nodeListForEach and takes in list and a callback function (which we pass in below)
        for (var i = 0; i < list.length; i++) {  
            callback(list[i], i);
        }
    };

    return { // allows us to access from other controller modules 
        getInput: function() { // method for returning all three inputs in the UI
            return {
            // .value reads value of the type
            type: document.querySelector(DOMStrings.inputType).value, // (inc or exp)
            description: document.querySelector(DOMStrings.inputDescription).value,  
            value: parseFloat(document.querySelector(DOMStrings.inputValue).value) // parseFloat converts income or expense value string to a number (so we can calculate budget totals)
            };
        }, 

        addListItem: function(obj, type) {
            var html, newHtml, element;

            // Create HTML string with placeholder text 
            if (type === 'inc') {
            element = DOMStrings.incomeContainer;
            html = '<div class="item clearfix" id="inc-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
            } else if (type === 'exp') {
            element = DOMStrings.expensesContainer;
            html = '<div class="item clearfix" id="exp-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__percentage">21%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
            }

            // Replace the placeholder text with actual data (recieved from object)
            newHtml = html.replace('%id%', obj.id);
            newHtml = newHtml.replace('%description%', obj.description);
            newHtml = newHtml.replace('%value%', formatNumber(obj.value, type));

            // Insert HTML into the DOM 
            // uses insertAdjacentHTML method. Accepts (position, text) - using position beforeend, which replaces the HTML before the element begins, but after the content 
            document.querySelector(element).insertAdjacentHTML('beforeend', newHtml); //determines if element is income or expense 
        },

        deleteListItem: function(selectorID) {
            var el = document.getElementById(selectorID);
            el.parentNode.removeChild(el); // have to traverse to parent, then remove child because the parent node needs to know which element to kill (it can't kill itself). We pass it back in, so the parent element knows exactly what to kill 
        },

        clearFields: function() {
            var fields, fieldsArray; 
            // clears the description and value fields from the UI
            fields = document.querySelectorAll(DOMStrings.inputDescription + ', ' + DOMStrings.inputValue); //querySelectorAll results in a list
            fieldsArray = Array.prototype.slice.call(fields); //converts the list into an array (tricks the slice method into applying slice onto a list instead of an array- and it calls the fields variable )

            fieldsArray.forEach(function(current, index, array) { //the forEach method loops over all the elements of the array, and sets the value back to an empty string "".  The annonymous callback function recieves three values (current, index, array)
                current.value = "";
            });
            fieldsArray[0].focus(); // moves the 'focus' aka the input location from value to description after entering 
        },

        displayBudget: function(obj) {
            var type;
            obj.budget > 0 ? type = 'inc' : type = 'exp';

            document.querySelector(DOMStrings.budgetLabel).textContent = formatNumber(obj.budget, type); // from the getBudget object
            document.querySelector(DOMStrings.incomeLabel).textContent = formatNumber(obj.totalInc, 'inc'); 
            document.querySelector(DOMStrings.expensesLabel).textContent = formatNumber(obj.totalExp, 'exp'); 
            

            if (obj.percentage > 0) {
                document.querySelector(DOMStrings.percentageLabel).textContent = obj.percentage + '%'; 
            } else {
                document.querySelector(DOMStrings.percentageLabel).textContent = '---';
            }
        },

        displayPercentages: function(percentages) {
            var fields = document.querySelectorAll(DOMStrings.expensesPercLabel); //creates an array with all the matching elements 

            nodeListForEach(fields, function(current, index) {  //calling the nodeListForEach function: calls the array fields with the HTML elements, and a callback
                if (percentages[index] > 0) {
                current.textContent = percentages[index] + '%';
                } else {
                current.textContent = '---';
                }
            });
        },

        displayMonth: function() {
        var now, months, month, year;

            var now = new Date(); //Date constructor - if nothing is passed in, it pulls the current date (year, month(0 based), day)

            months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            month = now.getMonth();

            year = now.getFullYear(); //method from the Date constructor 
            document.querySelector(DOMStrings.dateLabel).textContent = months[month] + ' ' + year;
        },

        changedType: function() {
            var fields = document.querySelectorAll( 
                DOMStrings.inputType + ',' + //these three elements will be targeted and changed to red 
                DOMStrings.inputDescription + ',' +
                DOMStrings.inputValue);

            nodeListForEach(fields, function(cur) { //calling function nodeListForEach, and passing in the args fields ^ and a callback function
                cur.classList.toggle('red-focus');
            });
            document.querySelector(DOMStrings.inputBtn).classList.toggle('red'); //changes the button red 
        },

        getDOMStrings: function() { // method for returning DOMStrings to other modules 
            return DOMStrings; 
        }
    };

})();




/***************** GLOBAL APP CONTROLLER module ****************************************************************************************/  
// Allows interactivity between other modules as needed- done by passing the other modules in as arguments)

var controller = (function(budgetCtrl, UICtrl) { //using different names, but passing in the original contoller names- this allows us to rename the budgetController and UIController modules if we want 
     
    var setUpEventListeners = function() {
        var DOM = UICtrl.getDOMStrings(); // accessing DOMStrings from the UI controller 

        // on button click - add expense or income 
        document.querySelector(DOM.inputBtn).addEventListener('click', ctrlAddItem); //ctrlAddItem - callback function

        // 'keypress' - ANY key except shift, Fn, Capslock is in pressed position - add expense or income 
        // keyCode property- identifies key pressed (Enter keyCode: 13) (which property for older browsers)
        document.addEventListener('keypress', function(event) { 
            if (event.keyCode === 13 || event.which === 13) {
                ctrlAddItem();
            }
        });

        document.querySelector(DOM.container).addEventListener('click', ctrlDeleteItem); // deletes items onClick - uses event delegation 

        document.querySelector(DOM.inputType).addEventListener('change', UICtrl.changedType);

    };

    var updateBudget = function() {
        // 1. Calculate the budget 
        budgetCtrl.calculateBudget();
        // 2. Return the budget 
        var budget = budgetCtrl.getBudget();
        // 3. Display the budget on the UI 
        UICtrl.displayBudget(budget); //passes in the object budget to display the values of the budget on the UI
    };

    var updatePercentages = function() {
        // 1. Calculate percentages
        budgetCtrl.calculatePercentages();

        // 2. Read percentages from the budget controller 
        var percentages = budgetCtrl.getPercentages();

        // 3. Update the UI 
        UICtrl.displayPercentages(percentages);
    };

    //control center for the app
    var ctrlAddItem = function() {
        var input, newItem;

        // 1. Get field input data 
        input = UICtrl.getInput(); //calls the getInput method from the UIController module 

        if (input.description !== "" && !isNaN(input.value) && input.value > 0) { //ensures the description input is not empty, and the value input only accepts a number over 0 

            // 2. Add item to the budget controller
            newItem = budgetCtrl.addItem(input.type, input.description, input.value); //calls the addItem method from the budgetController module, and it accepts three parameters 

            // 3. Add the new item to the UI 
            UICtrl.addListItem(newItem, input.type);

            // 4. Clear the fields 
            UICtrl.clearFields();

            // 5. Calculate and update budget 
            updateBudget();

            // 6. Calculate and update percentages 
            updatePercentages();

        } else {
            alert('Please input a description, and a value greater than 0.')
        }
    };

    var ctrlDeleteItem = function(event) { //accesses the 'event' parameter from the annonymous function on our keypress event listener
        var itemID, splitID, type, ID;

        itemID = event.target.parentNode.parentNode.parentNode.parentNode.id; // DOM traversing (targets the id "income-0" on the delete button)

        if(itemID) {
            // inc-1
            splitID = itemID.split('-'); //split method splits two strings at the -, so 'income-1' will be 'income' '1'
            type = splitID[0]; // first element of the array will be type (inc or exp)
            ID = parseInt(splitID[1]); // second element of the array (the number associated with the income or expense value) parseInt converts string to number 

            // 1. Delete the item from the data structure 
            budgetCtrl.deleteItem(type, ID);

            // 2. delete the item from the UI 
            UICtrl.deleteListItem(itemID);

            // 3. Update and show the new budget 
            updateBudget();

            // 4. Calculate and update percentages 
            updatePercentages();
        }
    };

    return { // calls the setUpEventListeners function so it can run
        init: function() {
            console.log('app started');
            UICtrl.displayMonth();
            UICtrl.displayBudget({  //will display all numbers as 0 inititally 
                budget: 0, 
                totalInc: 0, 
                totalExp: 0, 
                percentage: -1  
            });
            setUpEventListeners();
        }
    };

})(budgetController, UIController);

controller.init(); // starts app 

