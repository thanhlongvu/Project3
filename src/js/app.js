App = {
    web3Provider: null,
    accountCurrent: null,
    contracts: {},

    init: async function () {

        return await App.initWeb3();
    },

    initWeb3: async function () {
        // Modern dapp browsers...
        if (window.ethereum) {
            App.web3Provider = window.ethereum;
            try {
                // Request account access
                await window.ethereum.enable();
            } catch (error) {
                // User denied account access...
                console.error("User denied account access")
            }
        }
        // Legacy dapp browsers...
        else if (window.web3) {
            App.web3Provider = window.web3.currentProvider;
        }

        // If no injected web3 instance is detected, fall back to Ganache
        else {
            App.web3Provider = new Web3.providers.HttpProvider('http://localhost:8545');
        }

        web3 = new Web3(App.web3Provider);
        accountCurrent = web3.eth.accounts[0];

        //Refresh UI when change account ethereum
        setInterval(() => {
            if (web3.eth.accounts[0] !== accountCurrent) {
                accountCurrent = web3.eth.accounts[0];
                // App.markAdopted();
            }
        }, 2000);

        return App.initContract();
    },

    initContract: function () {
        $.getJSON('TokenERC20.json', function (data) {
            // Get the necessary contract artifact file and instantiate it with truffle-contract
            var ABIcode = data;
            App.contracts.TokenERC20 = TruffleContract(ABIcode);

            // Set the provider for our contract
            App.contracts.TokenERC20.setProvider(App.web3Provider);

            // Use our contract to retrieve and mark the adopted pets
            return App.getInstance();

        });

        // return App.bindEvents();

        //more...
        // App.contracts.TokenERC20.deployed().then(function(instance) {
        //   console.log(instance);
        // }).catch (function(err) {
        //   console.log(err.message);
        // });
    },

    // bindEvents: function () {
    //   $(document).on('click', '.btn-adopt', App.handleAdopt);
    // },

    getInstance: function (adopters, account) {
        App.contracts.TokenERC20.deployed().then(function (instance) {
            this.instance = instance;

            // console.log(adoptionInstance);

        }).catch(function (err) {
            console.log(err.message);
        });
        //   return adoptionInstance.getAdopters.call();
        // }).then(function (adopters) {
        //   for (i = 0; i < adopters.length; i++) {
        //     if (adopters[i] !== '0x0000000000000000000000000000000000000000') {
        //       $('.panel-pet').eq(i).find('button').text(adopters[i]).attr('disabled', true);
        //     }
        //     else {
        //       $('.panel-pet').eq(i).find('button').text('Adopt');
        //     }
        //   }
        // }).catch(function (err) {
        //   console.log(err.message);
        // });

        //onReady
        this.onReady();
    },

    //   handleAdopt: function (event) {
    //     event.preventDefault();

    //     var petId = parseInt($(event.target).data('id'));

    //     var adoptionInstance;

    //     web3.eth.getAccounts(function (error, accounts) {
    //       if (error) {
    //         console.log(error);
    //       }

    //       var account = accounts[0];

    //       App.contracts.Adoption.deployed().then(function (instance) {
    //         adoptionInstance = instance;

    //         // Execute adopt as a transaction by sending account
    //         return adoptionInstance.adopt(petId, { from: account });
    //       }).then(function (result) {
    //         return App.markAdopted();
    //       }).catch(function (err) {
    //         console.log(err.message);
    //       });
    //     });

    //   }

    ////////////////////////////// more//////////////////////////
    updateTotal: function () {

        App.contracts.TokenERC20.deployed().then(function (instance) {

            instance.totalSupply({ from: window.web3.eth.accounts[0] }).then(function (totalSupply) {

                // Get number of decimals
                instance.decimals({ from: window.web3.eth.accounts[0] }).then(function (decimals) {
                    var decimalsCount = Math.pow(10, decimals);
                    if (decimalsCount > 0)
                        $("#total-supply span").html(totalSupply.toNumber() / decimalsCount); // Convert totalSupply according to count of decimals
                    else
                        showStatus("ERROR: Dividing by zero");

                });
            });

        }).catch(function (err) {
            console.log(err.message);
        });
    },

    updateUserBalance: function () {
        var that = this;
        App.contracts.TokenERC20.deployed().then(function (instance) {

            that.getBalance(instance, window.web3.eth.accounts[0], function (error, balance) {
                if (error) {
                    console.log(error)
                }
                else {
                    // Get number of decimals
                    instance.decimals().then(function (decimals, err) {
                        if (err) {
                            console.log(err.mesage);
                        } else {
                            var decimalsCount = Math.pow(10, decimals);
                            if (decimalsCount > 0)
                                $("#your-balance span").html(balance.toNumber() / decimalsCount); // Convert userBalance according to count of decimals
                            else
                                showStatus("ERROR: Dividing by zero");
                        }
                    });
                }
            })
        })
    },


    getBalance: function (instance, address, cb) {
        instance.balanceOf(address).then(function (result, error) {
            cb(error, result);
        })
    },

    sendTokens: function () {
        var that = this;

        // Get input values
        var address = $("#send-address").val();
        var amount = $("#send-amount").val();

        // Convert amount according to count of decimals
        amount = amount * Math.pow(10, 5);

        // Validate address
        if (!isValidAddress(address)) {
            showStatus("Please enter valid address");
            return;
        }

        // Validate amount
        if (!isValidAmount(amount)) {
            showStatus("Please enter valid amount");
            return;
        }

        App.contracts.TokenERC20.deployed().then(function (instance) {
            // Transfer amount to other address
            instance.transfer(address.toString(), amount, { from: window.web3.eth.accounts[0], gas: 100000, gasPrice: 100000, gasLimit: 100000 })
                .then(function (txHash, error) {
                    if (error) {
                        console.log(error);
                    }
                    else {
                        // console.log(txHash);
                        showStatus("Sending transaction, please wait");
                        that.waitForReceipt(txHash.tx, function (receipt) {
                            if (receipt.status) {
                                showStatus("Transaction successful");
                                $("#send-address").val("");
                                $("#send-amount").val("");
                                that.updateUserBalance();
                            }
                            else {
                                var userBalance = $("#your-balance span").val();
                                if (amount > userBalance) {
                                    showStatus("You don't have enough Tokens");
                                    return;
                                }
                                showStatus("Something went wrong, please try it again");
                            }
                        });
                    }
                }
                )

        }).catch(function (err) {
            console.log(err.message);
        });
    },


    waitForReceipt: function (hash, cb) {
        var that = this;

        // Checks for transaction receipt
        window.web3.eth.getTransactionReceipt(hash, function (err, receipt) {
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
                window.setTimeout(function () {
                    that.waitForReceipt(hash, cb);
                }, 2000);
            }
        });
    },


    burnTokens: function () {
        var that = this;

        // Get input values
        var amount = $("#split-amount").val();

        // Convert amount according to count of decimals
        amount = amount * Math.pow(10, 5);

        // Validate amount
        if (!isValidAmount(amount)) {
            showStatus("Please enter valid amount");
            return;
        }

        App.contracts.TokenERC20.deployed().then(function (instance) {
            // Transfer amount to other address
            instance.burn(amount, { from: window.web3.eth.accounts[0], gas: 100000, gasPrice: 100000, gasLimit: 100000 })
            .then(function (txHash, error) {
                    if (error) {
                        console.log(error);
                    }
                    else {
                        that.waitForReceipt(txHash.tx, function (receipt) {
                            if (receipt.status) {
                                showStatus("Burning successful");
                                $("#burn-amount").val("");
                                that.updateUserBalance();
                                that.updateTotal();
                            }
                            else {
                                var userBalance = $("#your-balance span").val();
                                if (amount > userBalance) {
                                    showStatus("You don't have enough Tokens");
                                    return;
                                }
                                showStatus("Something went wrong, please try it again");
                            }
                        });
                    }
                }
            )

        }).catch(function (err) {
            console.log(err.message);
        });

    },


    showAddressBalance: function (hash, cb) {
        var that = this;

        // Get input values
        var address = $("#balance-address").val();

        // Validate address
        if (!isValidAddress(address)) {
            showStatus("Please enter valid address");
            return;
        }

        App.contracts.TokenERC20.deployed().then(function (instance) {
            that.getBalance(instance, address, function (error, balance) {
                if (error) {
                    console.log(error)
                }
                else {
                    // Get number of decimals
                    instance.decimals().then(function (decimals, error) {
                        if (error)
                            console.log(error)
                        else {
                            var amount = balance.toNumber() / Math.pow(10, decimals);
                            showStatus("Balance: " + amount);
                            $("#balance-address").val("");
                        }
                    });
                }
            })

        }).catch(function (err) {
            console.log(err.message);
        });

        
    },


    bindButtons: function () {
        var that = this;

        $(document).on("click", "#button-send", function () {
            that.sendTokens();
        });

        $(document).on("click", "#button-burn", function () {
            that.burnTokens();
        });

        $(document).on("click", "#button-check", function () {
            that.showAddressBalance();
        });
    },


    onReady: function () {
        // var that = this;

        // this.init(function () {
        //     // Show name of the Token
        //     that.instance.name(function (error, result) {
        //         if(error)
        //             console.log(error);
        //         else
        //             $("#token-name").html(result);
        //     });

        //     // Show symbol of the Token
        //     that.instance.symbol(function (error, result) {
        //         if(error)
        //             console.log(error);
        //         else
        //             $("#token-symbol").html(`(${result})`);
        //     });

        //     // Show total supply of tokens
        //     that.updateTotal();

        //     // Show user's balance of tokens
        //     that.updateUserBalance();

        //     // Bind all buttons
        //     that.bindButtons();
        // });

        // Show name of the Token

        App.contracts.TokenERC20.deployed().then(function (instance) {
            // instance.name({from: web3.eth.accounts[0]}, function (error, result) {
            //     if(error)
            //         console.log(error);
            //     else
            //         $("#token-name").html(result);
            // });

            $("#token-name").html("Real Estate");

            // console.log(instance)
        }).catch(function (err) {
            console.log(err.message);
        });


        // // Show symbol of the Token
        // this.instance.symbol(function (error, result) {
        //     if(error)
        //         console.log(error);
        //     else
        //         $("#token-symbol").html(`(${result})`);
        // });



        // Show total supply of tokens
        this.updateTotal();

        // Show user's balance of tokens
        this.updateUserBalance();

        // Bind all buttons
        this.bindButtons();
    }
};

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
    setTimeout(function () { status.className = status.className.replace("show", ""); }, 3000);
}

$(function () {
    $(window).load(function () {
        App.init();
    });
});