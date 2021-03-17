pragma solidity 0.4.25;

interface ICEther {
    function borrow(uint256 borrowAmount) external returns (uint256);
    function repayBorrow() external payable returns (uint256);
}