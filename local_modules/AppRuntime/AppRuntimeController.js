// Copyright (c) 2014-2017, MyMonero.com
//
// All rights reserved.
//
// Redistribution and use in source and binary forms, with or without modification, are
// permitted provided that the following conditions are met:
//
// 1. Redistributions of source code must retain the above copyright notice, this list of
//	conditions and the following disclaimer.
//
// 2. Redistributions in binary form must reproduce the above copyright notice, this list
//	of conditions and the following disclaimer in the documentation and/or other
//	materials provided with the distribution.
//
// 3. Neither the name of the copyright holder nor the names of its contributors may be
//	used to endorse or promote products derived from this software without specific
//	prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY
// EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
// MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL
// THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
// PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
// INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT,
// STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF
// THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
"use strict"
//
const EventEmitter = require('events') // TODO: abstract for platform independence
//
class AppRuntimeController extends EventEmitter
{

	////////////////////////////////////////////////////////////////////////////////
	// Initialization

	constructor(options, context)
	{
		super() // must call super before accessing `this`
		const self = this
		self.options = options
		self.context = context
		//
		self.setup()
	}
	setup()
	{
		const self = this
		self.startObserving_uncaughtExceptions()
	}
	startObserving_uncaughtExceptions()
	{
		const self = this
		process.on('uncaughtException', function (error)
		{ // We're going to observe this here (for electron especially) so
		  // that the exceptions are prevented from bubbling up to the UI.
		  // startObserving_uncaughtExceptions /might/ be able to be moved to ….electron.js
			console.error("AppRuntimeController observed uncaught exception", error)
			// TODO: send this to the error reporting service
		})
	}
	setup_concreteImpOverride_startObserving_app()
	{	
		throw "You must override setup_concreteImpOverride_startObserving_app but not call it on super"
	}
	

	////////////////////////////////////////////////////////////////////////////////
	// Runtime - Accessors - Events
	
	EventName_appWillQuit()
	{
		return "EventName_appWillQuit"
	}
	

	////////////////////////////////////////////////////////////////////////////////
	// Runtime - Accessors - Concrete-implementation-overridable

	Platform()
	{
		throw "implement this in your subclass"
	}
	Platforms()
	{
		throw "implement this in your subclass"
	}
	

	////////////////////////////////////////////////////////////////////////////////
	// Runtime (not setup) - Imperatives - Setup - Observation
	
	_startObserving_walletsController()
	{ // this is called by self.RuntimeContext_postWholeContextInit_setup
		const self = this
		const walletsListController = self.context.walletsListController
		walletsListController.on(
			walletsListController.EventName_aWallet_balanceChanged(),
			function(emittingWallet, old_total_received, old_total_sent, old_locked_balance)
			{
				self._aWallet_balanceChanged(emittingWallet, old_total_received, old_total_sent, old_locked_balance)
			}
		)
		walletsListController.on(
			walletsListController.EventName_aWallet_transactionsAdded(),
			function(emittingWallet, numberOfTransactionsAdded, newTransactions)
			{
				self._aWallet_transactionsAdded(emittingWallet, numberOfTransactionsAdded, newTransactions)
			}
		)		
	}
	
	
	////////////////////////////////////////////////////////////////////////////////
	// Runtime - Imperatives - Emissions - Callable by concrete implementations
	
	_calledByConcreteImplementation_broadcastThatAppWillQuit(fn)
	{ // must call fn to tell concrete implementation to proceed with its implementation of quit
		const self = this
		console.log("💬  App will quit.")
		self.emit(self.EventName_appWillQuit())
		// ^ synchronous so we can just call fn
		fn()
	}
	
	
	////////////////////////////////////////////////////////////////////////////////
	// Runtime - Delegation - Post-instantiation hook
	
	RuntimeContext_postWholeContextInit_setup()
	{
		const self = this
		// We have to wait until post-whole-context-init to guarantee context members-to-observe exist
		self._concreteImpOverride_startObserving_app() // you should implement this in your platform-specific implementation
		self._startObserving_walletsController()
	}


	////////////////////////////////////////////////////////////////////////////////
	// Runtime - Delegation - Proxying - Password controller

	passwordController__obtainPasswordFromUser_wOptlValidationErrMsg_cb(
		passwordController,
		obtainedErrOrPwAndType_cb,
		showingValidationErrMsg_orUndefined
	)
	{
		const self = this
		if (typeof showingValidationErrMsg_orUndefined !== 'undefined') {
			console.log("Password entry validation error:", showingValidationErrMsg_orUndefined)
		}
		var errToPassBack = null // use err if user cancelled - err will cancel the pw change
		var obtained_passwordString;
		var obtained_typeOfPassword;
		obtained_passwordString = "a much stronger password than before"
		obtained_typeOfPassword = passwordController.AvailableUserSelectableTypesOfPassword().FreeformStringPW
		obtainedErrOrPwAndType_cb(
			errToPassBack,
			obtained_passwordString,
			obtained_typeOfPassword
		)
	}
	passwordController__didSetFirstPasswordDuringThisRuntime_cb(passwordController, password)
	{
		const self = this
	}
	passwordController__didChangePassword_cb(passwordController, password)
	{
		// TODO: funnel into a singular function which tells the wallets and contacts list controllers to re-save
		const self = this
		console.log("TODO: passwordController__didChangePassword_cb; inform wallet + contact lists")
	}


	////////////////////////////////////////////////////////////////////////////////
	// Runtime - Delegation - Events - WalletsListController
	
	_aWallet_balanceChanged(emittingWallet, old_total_received, old_total_sent, old_locked_balance)
	{
		const self = this
		console.log("app runtime c hears _aWallet_balanceChanged", emittingWallet._id, old_total_received, old_total_sent, old_locked_balance)
	}	
	_aWallet_transactionsAdded(emittingWallet, numberOfTransactionsAdded, newTransactions)
	{
		const self = this
		console.log("app runtime c hears _aWallet_transactionsAdded", emittingWallet._id, numberOfTransactionsAdded, newTransactions)
	}
}
module.exports = AppRuntimeController
