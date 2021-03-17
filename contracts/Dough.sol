// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.4.25;

import "./ownership/Ownable.sol";
import "./math/SafeMath.sol";
import "./token/ERC20.sol";
import "./token/ERC20Detailed.sol";
import "./interfaces/ICERC20.sol";
import "./interfaces/IWETH.sol";

contract Dough is Ownable, ERC20, ERC20Detailed {
    using SafeMath for uint256;

    address private constant ETH = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;
    IWETH private WETH;

    IERC20 public reserveToken;
    ICERC20 public cReserveToken;
    uint256 public totalReserve;
    uint256 public mintFeeBPS;
    mapping(address => bool) treasurers;

    event Minted(address sender, uint256 amount);
    event Burned(address sender, uint256 amount);

    constructor(
        address _reserveTokenAddress,
        address _cReserveTokenAddress,
        uint256 _mintFeeBPS,
        address _wethTokenAddress
    ) public ERC20Detailed("Breadchain Wrapped Dai", "DOUGH", 18) {
        reserveToken = IERC20(_reserveTokenAddress);
        cReserveToken = ICERC20(_cReserveTokenAddress);
        WETH = IWETH(_wethTokenAddress);
        mintFeeBPS = _mintFeeBPS;
    }

    function mint(uint256 _amount) public {
        uint256 rewardAmount = _amount.sub(_amount.mul(mintFeeBPS).div(10000));
        _handleMint(rewardAmount);
        require(reserveToken.transferFrom(msg.sender, address(this), _amount), "mint() ERC20.transferFrom failed.");
        require(reserveToken.approve(address(cReserveToken), _amount), "mint() ERC20.approve failed.");
        require(cReserveToken.mint(_amount) == 0, "mint() cERC20.mint failed.");
        totalReserve = totalReserve.add(rewardAmount);
    }

    function burn(uint256 _amount) public {
        _handleBurn(_amount);
        require(cReserveToken.redeemUnderlying(_amount) == 0, "burn() cERC20.redeemUnderlying failed.");
        require(reserveToken.transfer(msg.sender, _amount), "burn() ERC20.transfer failed.");
        totalReserve = totalReserve.sub(_amount);
    }

    function whitelistTreasurer(address newTreasurer) public onlyOwner {
        require(!treasurers[newTreasurer], "treasurer already whitelisted");
        treasurers[newTreasurer] = true;
    }

    function blacklistTreasurer(address treasurer) public onlyOwner {
        require(treasurers[treasurer], "target is not a treasurer");
        treasurers[treasurer] = false;
    }

    function withdrawInterest(uint256 _amount) public {
        require(treasurers[msg.sender] || msg.sender == owner(), "only treasurers or owner can withdraw interest");
        uint256 interest = reserveDifferential();
        require(interest >= _amount, "withdrawInterest() interest accrued is below withdraw amount");
        require(cReserveToken.redeemUnderlying(_amount) == 0, "withdrawInterest() cERC20.redeemUnderlying failed.");
        require(reserveToken.transfer(msg.sender, _amount), "withdrawInterest() ERC20.transfer failed.");
    }

    function withdrawToken(address _tokenAddress, uint256 _amount) public {
        require(treasurers[msg.sender] || msg.sender == owner(), "only treasurers or owner can withdraw tokens");
        require(_tokenAddress != address(cReserveToken), "withdrawToken() cannot withdraw collateral token.");
        if (_tokenAddress == ETH) {
            require(address(this).balance >= _amount);
            WETH.deposit.value(_amount)();
            _tokenAddress = WETH;
        }
        require(IERC20(_tokenAddress).transfer(msg.sender, _amount), "withdrawToken() ERC20.transfer failed.");
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