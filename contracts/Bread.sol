// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.4.25;

import "./ownership/Ownable.sol";
import "./math/SafeMath.sol";
import "./token/ERC20.sol";
import "./token/ERC20Detailed.sol";
import "./interfaces/ICERC20.sol";
import "./interfaces/IWETH.sol";

contract Bread is Ownable, ERC20, ERC20Detailed {
    address private constant ETH = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

    IERC20 public reserveToken;
    ICERC20 public cReserveToken;
    uint256 public totalReserve;
    mapping(address => mapping (address => uint256)) withdrawAllowance;

    event Minted(address sender, uint256 amount);
    event Burned(address sender, uint256 amount);
    event WithdrawalApproval(address spender, address token, uint256 amount);

    constructor(
        address _reserveTokenAddress,
        address _cReserveTokenAddress
    ) public ERC20Detailed("Breadchain Crowdstaking", "BREAD", 18) {
        reserveToken = IERC20(_reserveTokenAddress);
        cReserveToken = ICERC20(_cReserveTokenAddress);
    }

    function mint(uint256 _amount) public {
        _handleMint(_amount);
        require(reserveToken.transferFrom(msg.sender, address(this), _amount), "mint() ERC20.transferFrom failed.");
        require(reserveToken.approve(address(cReserveToken), _amount), "mint() ERC20.approve failed.");
        require(cReserveToken.mint(_amount) == 0, "mint() cERC20.mint failed.");
        totalReserve = totalReserve.add(_amount);
    }

    function burn(uint256 _amount) public {
        _handleBurn(_amount);
        require(cReserveToken.redeemUnderlying(_amount) == 0, "burn() cERC20.redeemUnderlying failed.");
        require(reserveToken.transfer(msg.sender, _amount), "burn() ERC20.transfer failed.");
        totalReserve = totalReserve.sub(_amount);
    }

    function increaseWithdrawalApproval(address _to, address _tokenAddress, uint256 _amount) public onlyOwner {
        require(_tokenAddress != address(cReserveToken), "increaseWithdrawalAllowance() cannot withdraw collateral token.");
        withdrawAllowance[_to][_tokenAddress] = withdrawAllowance[_to][_tokenAddress].add(_amount);
        emit WithdrawalApproval(_to, _tokenAddress, withdrawAllowance[_to][_tokenAddress]);
    }

    function decreaseWithdrawalApproval(address _to, address _tokenAddress, uint256 _amount) public onlyOwner {
        require(_tokenAddress != address(cReserveToken), "decreaseWithdrawalAllowance() cannot withdraw collateral token.");
        withdrawAllowance[_to][_tokenAddress] = withdrawAllowance[_to][_tokenAddress].sub(_amount);
        emit WithdrawalApproval(_to, _tokenAddress, withdrawAllowance[_to][_tokenAddress]);
    }

    function withdrawInterest(uint256 _amount) public {
        if (!isOwner()) {
            uint256 currentAllowance = withdrawAllowance[msg.sender][address(reserveToken)];
            require(currentAllowance >= _amount, "withdrawInterest() not enough withdrawAllowance");
            withdrawAllowance[msg.sender][address(reserveToken)] = currentAllowance.sub(_amount);
            emit WithdrawalApproval(msg.sender, address(reserveToken), withdrawAllowance[msg.sender][address(reserveToken)]);
        }
        uint256 interest = reserveDifferential();
        require(interest >= _amount, "withdrawInterest() interest accrued is below withdraw amount");
        require(cReserveToken.redeemUnderlying(_amount) == 0, "withdrawInterest() cERC20.redeemUnderlying failed.");
        require(reserveToken.transfer(msg.sender, _amount), "withdrawInterest() ERC20.transfer failed.");
    }

    function withdrawToken(address _tokenAddress, uint256 _amount) public {
        require(_tokenAddress != address(cReserveToken), "withdrawToken() cannot withdraw collateral token.");
        if (!isOwner()) {
            uint256 currentAllowance = withdrawAllowance[msg.sender][_tokenAddress];
            require(currentAllowance >= _amount, "withdrawInterest() not enough withdrawAllowance");
            withdrawAllowance[msg.sender][_tokenAddress] = currentAllowance.sub(_amount);
            emit WithdrawalApproval(msg.sender, _tokenAddress, withdrawAllowance[msg.sender][_tokenAddress]);
        }
        if (_tokenAddress == ETH) {
            require(address(this).balance >= _amount);
            msg.sender.transfer(_amount);
        } else {
            require(IERC20(_tokenAddress).transfer(msg.sender, _amount), "withdrawToken() ERC20.transfer failed.");
        }
    }

    function reserveBalance() public view returns (uint256) {
        return totalReserve;
    }

    function reserveDifferential() public view returns (uint256) {
        return cReserveToken.balanceOfUnderlying(address(this)).sub(totalReserve);
    }

    function _handleMint(uint256 _amount) internal {
        require(_amount > 0, "Deposit must be non-zero.");
        _mint(msg.sender, _amount);
        emit Minted(msg.sender, _amount);
    }

    function _handleBurn(uint256 _amount) internal {
        require(_amount > 0, "Amount must be non-zero.");
        require(balanceOf(msg.sender) >= _amount, "Insufficient tokens to burn.");

        _burn(msg.sender, _amount);
        emit Burned(msg.sender, _amount);
    }
}