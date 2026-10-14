
 // SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract CryptoTrack {
    struct Holding {
        uint256 id;
        string coinName;
        string symbol;
        uint256 quantity;
        uint256 purchasePrice;
    }

    uint256 private nextId = 1;

    mapping(address => Holding[]) private portfolios;

    event HoldingAdded(address indexed user, uint256 id, string symbol);
    event HoldingUpdated(address indexed user, uint256 id);
    event HoldingRemoved(address indexed user, uint256 id);

    function addHolding(
        string memory coinName,
        string memory symbol,
        uint256 quantity,
        uint256 purchasePrice
    ) external {
        require(bytes(coinName).length > 0, "Coin name required");
        require(bytes(symbol).length > 0, "Symbol required");
        require(quantity > 0, "Quantity must be positive");
        require(purchasePrice > 0, "Price must be positive");

        uint256 id = nextId++;

        portfolios[msg.sender].push(
            Holding(id, coinName, symbol, quantity, purchasePrice)
        );

        emit HoldingAdded(msg.sender, id, symbol);
    }

    function getMyHoldings() external view returns (Holding[] memory) {
        return portfolios[msg.sender];
    }

    function updateHolding(
        uint256 id,
        uint256 quantity,
        uint256 purchasePrice
    ) external {
        require(quantity > 0, "Quantity must be positive");
        require(purchasePrice > 0, "Price must be positive");

        Holding[] storage holdings = portfolios[msg.sender];

        for (uint256 i = 0; i < holdings.length; i++) {
            if (holdings[i].id == id) {
                holdings[i].quantity = quantity;
                holdings[i].purchasePrice = purchasePrice;
                emit HoldingUpdated(msg.sender, id);
                return;
            }
        }

        revert("Holding not found");
    }

    function removeHolding(uint256 id) external {
        Holding[] storage holdings = portfolios[msg.sender];

        for (uint256 i = 0; i < holdings.length; i++) {
            if (holdings[i].id == id) {
                holdings[i] = holdings[holdings.length - 1];
                holdings.pop();
                emit HoldingRemoved(msg.sender, id);
                return;
            }
        }

        revert("Holding not found");
    }
}