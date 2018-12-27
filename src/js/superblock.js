// The object 'Contracts' will be injected here, which contains all data for all contracts, keyed on contract name:
// Contracts['TokenERC20'] = {
//  abi: [],
//  address: "0x..",
//  endpoint: "http://...."
// }

function MyToken(Contract) {
    this.web3 = null;
    this.instance = null;
    this.Contract = Contract;
}

// Show totalSupply of Tokens in navigation
MyToken.prototype.updateTotal = function() {
    var that = this;

    this.instance.totalSupply(function (error, totalSupply) {
        if(error) {
            console.log(error)
        }
        else {
            // Get number of decimals
            that.instance.decimals(function(error, decimals) {
                if(error)
                    console.log(error)
                else {
                    var decimalsCount = Math.pow(10, decimals);
                    if(decimalsCount > 0)
                        $("#total-supply span").html(totalSupply.toNumber() / decimalsCount); // Convert totalSupply according to count of decimals
                    else
                        showStatus("ERROR: Dividing by zero");
                }
            });
        }
    });
}

// Show userBalance of Tokens in navigation
MyToken.prototype.updateUserBalance = function() {
    var that = this; 

    this.getBalance(window.web3.eth.accounts[0], function(error, balance) {
        if(error) {
            console.log(error)
        }
        else {
            // Get number of decimals
            that.instance.decimals(function(error, decimals) {
                if(error)
                    console.log(error)
                else {
                    var decimalsCount = Math.pow(10, decimals);
                    if(decimalsCount > 0)
                        $("#your-balance span").html(balance.toNumber() / decimalsCount); // Convert userBalance according to count of decimals
                    else
                        showStatus("ERROR: Dividing by zero");
                } 
            });
        }
    })
}

// Get balance of Tokens found by address
MyToken.prototype.getBalance = function(address, cb) {
    this.instance.balanceOf(address, function(error, result) {
        cb(error, result);
    })
}

// Send Tokens to other address
MyToken.prototype.sendTokens = function() {
    var that = this;

    // Get input values
    var address = $("#send-address").val();
    var amount = $("#send-amount").val();

    // Convert amount according to count of decimals
    amount = amount * Math.pow(10, 18); 

    // Validate address
    if(!isValidAddress(address)) {
        showStatus("Please enter valid address");
        return;
    }

    // Validate amount
    if(!isValidAmount(amount)) {
        showStatus("Please enter valid amount");
        return;
    }

    // Transfer amount to other address
    this.instance.transfer(address, amount, { from: window.web3.eth.accounts[0], gas: 100000, gasPrice: 100000, gasLimit: 100000 }, 
        function(error, txHash) {
            if(error) {
                console.log(error);
            }
            else {
                showStatus("Sending transaction, please wait");
                that.waitForReceipt(txHash, function(receipt) {
                    if(receipt.status) {
                        showStatus("Transaction successful");
                        $("#send-address").val("");
                        $("#send-amount").val("");
                        that.updateUserBalance();
                    }
                    else {
                        var userBalance = $("#your-balance span").val();
                        if(amount > userBalance) {
                            showStatus("You don't have enough Tokens");
                            return;
                        }
                        showStatus("Something went wrong, please try it again");
                    }
                });
            }
        }
    )
}


// Burn Tokens
MyToken.prototype.burnTokens = function() {
    var that = this;

    // Get input values
    var amount = $("#burn-amount").val();

    // Convert amount according to count of decimals
    amount = amount * Math.pow(10, 18); 

    // Validate amount
    if(!isValidAmount(amount)) {
        showStatus("Please enter valid amount");
        return;
    }

    // Transfer amount to other address
    this.instance.burn(amount, { from: window.web3.eth.accounts[0], gas: 100000, gasPrice: 100000, gasLimit: 100000 }, 
        function(error, txHash) {
            if(error) {
                console.log(error);
            }
            else {
                that.waitForReceipt(txHash, function(receipt) {
                    if(receipt.status) {
                        showStatus("Burning successful");
                        $("#burn-amount").val("");
                        that.updateUserBalance();
                        that.updateTotal();
                    }
                    else {
                        var userBalance = $("#your-balance span").val();
                        if(amount > userBalance) {
                            showStatus("You don't have enough Tokens");
                            return;
                        }
                        showStatus("Something went wrong, please try it again");
                    }
                });
            }
        }
    )
}

MyToken.prototype.showAddressBalance = function(hash, cb) {
    var that = this;

    // Get input values
    var address = $("#balance-address").val();

    // Validate address
    if(!isValidAddress(address)) {
        showStatus("Please enter valid address");
        return;
    }

    this.getBalance(address, function(error, balance) {
        if(error) {
            console.log(error)
        }
        else {
            // Get number of decimals
            that.instance.decimals(function(error, decimals) {
                if(error)
                    console.log(error)
                else {
                    var amount = balance.toNumber() / Math.pow(10, decimals);
                    showStatus("Balance: " + amount);
                    $("#balance-address").val("");
                } 
            });
        }
    })
}

// Waits for receipt from transaction
MyToken.prototype.waitForReceipt = function(hash, cb) {
    var that = this;

    // Checks for transaction receipt
    this.web3.eth.getTransactionReceipt(hash, function(err, receipt) {
        if (err) {
            error(err);
        }
        if (receipt !== null) {
            // Transaction went through
            if (cb) {
                cb(receipt);
            }
        } else {
            // Try again in 2 second
            window.setTimeout(function() {
                that.waitForReceipt(hash, cb);
            }, 2000);
        }
    });
}

// Basic validation of amount. Bigger than 0 and typeof number
function isValidAmount(amount) {
    return amount > 0 && typeof Number(amount) == 'number';    
}

// Check if it has the basic requirements of an address
function isValidAddress(address) {
    return /^(0x)?[0-9a-f]{40}$/i.test(address);
}

// Show status on bottom of the page when some action happens
function showStatus(text) {
    var status = document.getElementById("status");
    status.innerHTML = text;
    status.className = "show";
    setTimeout(function(){ status.className = status.className.replace("show", ""); }, 3000);
} 

MyToken.prototype.bindButtons = function() {
    var that = this;

    $(document).on("click", "#button-send", function() {
        that.sendTokens();
    });

    $(document).on("click", "#button-burn", function() {
        that.burnTokens();
    });

    $(document).on("click", "#button-check", function() {
        that.showAddressBalance();
    }); 
}

MyToken.prototype.onReady = function() {
    var that = this;

    this.init(function () {
        // Show name of the Token
        that.instance.name(function (error, result) {
            if(error)
                console.log(error);
            else
                $("#token-name").html(result);
        });

        // Show symbol of the Token
        that.instance.symbol(function (error, result) {
            if(error)
                console.log(error);
            else
                $("#token-symbol").html(`(${result})`);
        });

        // Show total supply of tokens
        that.updateTotal();

        // Show user's balance of tokens
        that.updateUserBalance();

        // Bind all buttons
        that.bindButtons();
    });
}

MyToken.prototype.init = function(cb) {
    // We create a new Web3 instance using either the Metamask provider
    // or an independent provider created towards the endpoint configured for the contract.
    this.web3 = new Web3(
        (window.web3 && window.web3.currentProvider) ||
        new Web3.providers.HttpProvider(this.Contract.endpoint));

    // Create the contract interface using the ABI provided in the configuration.
    var contract_interface = this.web3.eth.contract(this.Contract.abi);

    // Create the contract instance for the specific address provided in the configuration.
    this.instance = contract_interface.at(this.Contract.address);

    cb();
}

var myToken = new MyToken(Contracts['TokenERC20']);

$(document).ready(function() {
    myToken.onReady();
});