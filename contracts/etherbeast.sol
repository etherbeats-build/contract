// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./ERC404.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract EtherBeast is ERC404, Pausable {
    enum Evolution {
        Phase0,
        Phase1,
        Phase2,
        Phase3
    }

    uint256 public totalPiece = 10001;
    mapping(Evolution => string) public phaseURIs;
    address private marketingWallet; // marketingWallet
    address private airdropWallet; // airdropWallet
    Evolution public currentEvolution; // currentEvolution
    uint256 public taxRate = 0; // launchTax
    bool public activeTax = false;
    address public _authorizedSigner;
    mapping(address => uint256) public _usedNonce;

    event Airdrop(address owner, uint256 amount);

    constructor(
        address _owner,
        address _marketingWallet,
        address _airdropWallet,
        string memory initialUri
    ) ERC404("EtherBeast", "BEASTS", 18, totalPiece, _owner) {
        balanceOf[_owner] = totalPiece * 10 ** 18;
        currentEvolution = Evolution.Phase0;
        phaseURIs[Evolution.Phase0] = initialUri;
        marketingWallet = _marketingWallet;
        airdropWallet = _airdropWallet;
        _authorizedSigner = msg.sender;
    }

    modifier verifyNonce(
        uint256 nonce,
        uint256 amount,
        bytes memory signature
    ) {
        bytes32 _messageHash = keccak256(abi.encodePacked(amount, nonce));
        bytes32 message = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", _messageHash)
        );
        address signer = recoverSigner(message, signature);

        require(signer == _authorizedSigner, "Invalid signer");
        require(_usedNonce[signer] == 0, "Nonce already used");

        _usedNonce[signer]++;
        _;
    }
    // TO BE DELETED
    function verifySigner(
        uint256 nonce,
        uint256 amount,
        bytes memory signature
    ) public pure returns (address) {
        bytes32 _messageHash = keccak256(abi.encodePacked(amount, nonce));
        bytes32 message = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", _messageHash)
        );
        address recoveredAddress = recoverSigner(message, signature);
        return recoveredAddress;
    }

    function recoverSigner(
        bytes32 message,
        bytes memory signature
    ) public pure returns (address) {
        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly {
            r := mload(add(signature, 32))
            s := mload(add(signature, 64))
            v := byte(0, mload(add(signature, 96)))
        }

        if (v < 27) {
            v += 27;
        }
        return ecrecover(message, v, r, s);
    }

    function withdrawAirdrop(
        uint256 nonce,
        uint256 amount,
        bytes memory signature
    ) external verifyNonce(nonce, amount, signature) {
        require(balanceOf[airdropWallet] >= amount, "Insufficient balance");
        super._transfer(airdropWallet, msg.sender, amount);
        emit Airdrop(msg.sender, amount);
    }

    function setNameSymbol(
        string memory _name,
        string memory _symbol
    ) public onlyOwner {
        _setNameSymbol(_name, _symbol);
    }

    function _mint(address to) internal override whenNotPaused {
        return super._mint(to);
    }

    function tokenURI(uint256 id) public view override returns (string memory) {
        string memory baseURI = phaseURIs[currentEvolution];
        return
            bytes(baseURI).length > 0
                ? string.concat(baseURI, Strings.toString(id % totalPiece))
                : "";
    }

    function setPhaseURI(Evolution phase, string memory uri) public onlyOwner {
        phaseURIs[phase] = uri;
    }

    function setPhase(Evolution phase) public onlyOwner {
        currentEvolution = phase;
    }

    function setTaxRate(uint256 _taxRate) public onlyOwner {
        require(_taxRate < 100, "Tax rate cannot exceed 100%");
        taxRate = _taxRate;
    }

    function setActivateTax(bool _activeTax) public onlyOwner {
        activeTax = _activeTax;
    }

    function setAuthorizedSigner(address authorizedSigner) public onlyOwner {
        _authorizedSigner = authorizedSigner;
    }

    function _transfer(
        address from,
        address to,
        uint256 amount
    ) internal override whenNotPaused returns (bool) {
        uint256 taxAmount = activeTax ? (amount * taxRate) / 100 : 0;
        if (activeTax) {
            super._transfer(from, marketingWallet, taxAmount);
        }
        return super._transfer(from, to, amount - taxAmount);
    }
}
