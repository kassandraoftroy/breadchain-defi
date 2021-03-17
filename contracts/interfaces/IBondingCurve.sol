pragma solidity 0.4.25;


interface IBondingCurve {
    /**
    * @dev Given a reserve token amount, calculates the amount of continuous tokens returned.
    */
    function getContinuousMintReward(uint256 _reserveTokenAmount) external view returns (uint256);

    /**
    * @dev Given a continuous token amount, calculates the amount of reserve tokens returned.
    */  
    function getContinuousBurnRefund(uint256 _continuousTokenAmount) external view returns (uint256);
}
