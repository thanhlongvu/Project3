pragma solidity ^0.4.24;


contract AccessControl {

    address internal ownerDapp;

    modifier onlyOwnerDapp() {
        require(msg.sender == ownerDapp);
        _;
    }


    constructor() public {
        ownerDapp = msg.sender;
    }

    function setOwner(address _addr) public onlyOwnerDapp {
        ownerDapp = _addr;
    }
}


contract User {

    struct UserInfo {
        uint64 id;

        /// more info
        //...
    }

    mapping (address => UserInfo) addressToUserInfo;

    uint64 public userTotal;

    //modifiers
    modifier onlyUser() {
        require(addressToUserInfo[msg.sender].id != 0x0);
        _;
    }
}



contract PlotBase is AccessControl, User {

    enum StatePlot { UNFINISHED, READY, PROCESSING }


    struct Plot {
        uint64 id;
        address owner;
        address[] oldOwner;

        StatePlot state;

        // more info for the plot
        // .......
        uint _s;

    }

    //storage

    //from plot Id to owner's address 
    mapping (uint => address) idPlotToOwner;

    //Plot number of owner
    mapping (address => uint) countPlotOwner;


    //Plot Total
    uint64 internal plotTotal;
    Plot[] internal plots;
    Plot[] internal plotsUnfinish;



    //modifier
    modifier onlyOwner(uint id) {
        require(msg.sender == idPlotToOwner[id]);
        _;
    }

    

    //methods

    /// User want create a plot infors of the plot 
    function createPlot(uint _s) public onlyUser returns(uint) {
        //Info valid???
        //require()???


        //Get info to a object
        uint64 _id = plotTotal;

        Plot memory _plot = Plot(_id ,msg.sender, new address[](0), StatePlot.UNFINISHED, _s);
        plotTotal++;
        //store to plot array
        plotsUnfinish.push(_plot);


        return (_id);
    }




    /// Just owner-dapp can approve a plot UNFINISHED
    function approvalPlot(uint _id) external onlyOwnerDapp returns(uint) {
        require(plotsUnfinish[_id].id != 0x0);

        //Get pointer to Plot obj
        Plot storage _plot = plotsUnfinish[_id];

        //Change state of plot
        _plot.state = StatePlot.READY;

        //Storage to plots array
        plots.push(_plot);

        delete plotsUnfinish[_id];
    }


    function addOldOwner(address _oldOwner, uint _plotId) internal onlyOwner(_plotId) {
        //Get plot
        Plot storage _plot = plots[_plotId];

        //Add to array oldOwner
        _plot.oldOwner.push(_oldOwner);
    }


    /// split in half the plot
    function splitPlot(uint _id, uint _decreaseS) external onlyUser{
        //TODO:ref to this plot
        Plot storage _plot = plots[_id];

        require(_decreaseS < _plot._s);
        //decrease 's' of this plot
        _plot._s -= _decreaseS;


        //Crease a new plot
        uint _newPlot = this.createPlot(_decreaseS);
    }
}


// contract PlotTransfer is PlotBase {
    
// }



contract PlotOwnership is PlotBase {

    mapping (uint => address) approveToken;

    event Transfer(
        address indexed from,
        address indexed to,
        uint256 value
    );

    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );


    function totalSupply() external view returns (uint256) {
        return plotTotal;
    }

    function balanceOf(address who) external view returns (uint256) {
        return countPlotOwner[who];
    }

    


    function toString(address x) internal pure returns (string memory) {
        bytes memory b = new bytes(20);
        for (uint i = 0; i < 20; i++)
            b[i] = byte(uint8(uint(x) / (2**(8*(19 - i)))));
        return string(b);
    }

    function transfer(address to, uint256 value) external onlyOwner(value) returns (bool){
        require(plots[value].state == StatePlot.READY);
        //transfer to new owner
        Plot storage _plot = plots[value];
        
        //Change plot info 
        _plot.owner = to;

        //add old owner
        _plot.oldOwner.push(msg.sender);

        //change count plot of 2 owner
        countPlotOwner[msg.sender]--;
        countPlotOwner[to]++;
    }
}