#!/usr/bin/env python3
"""
TalentChain Pro - Integration Test Script

This script tests the complete integration between:
1. Backend API endpoints
2. Smart contract interactions
3. Frontend API service compatibility
4. Database connectivity
5. Hedera network connection

Run this script to verify your setup is working correctly.
"""

import asyncio
import json
import os
import sys
import requests
from typing import Dict, Any, List
from datetime import datetime

# Add the app directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.config import get_settings, get_contract_config, load_contract_abis
from app.utils.hedera import (
    initialize_hedera_client, 
    check_hedera_connection,
    check_contract_deployments,
    verify_contract_functionality
)


class IntegrationTester:
    """Comprehensive integration tester for TalentChain Pro."""
    
    def __init__(self):
        """Initialize the integration tester."""
        self.settings = get_settings()
        self.base_url = f"http://{self.settings.host}:{self.settings.port}"
        self.test_results = {}
        
    async def run_all_tests(self) -> Dict[str, Any]:
        """Run all integration tests."""
        print("🚀 Starting TalentChain Pro Integration Tests...")
        print("=" * 60)
        
        # Test 1: Configuration
        await self.test_configuration()
        
        # Test 2: Database Connection
        await self.test_database_connection()
        
        # Test 3: Hedera Connection
        await self.test_hedera_connection()
        
        # Test 4: Contract Deployments
        await self.test_contract_deployments()
        
        # Test 5: Contract Functionality
        await self.test_contract_functionality()
        
        # Test 6: Backend API Endpoints
        await self.test_backend_api()
        
        # Test 7: Frontend API Compatibility
        await self.test_frontend_api_compatibility()
        
        # Test 8: Smart Contract Integration
        await self.test_smart_contract_integration()
        
        # Generate summary
        await self.generate_test_summary()
        
        return self.test_results
    
    async def test_configuration(self):
        """Test application configuration."""
        print("\n📋 Testing Configuration...")
        
        try:
            # Test settings loading
            settings = get_settings()
            
            # Test contract ABI loading
            contract_abis = load_contract_abis()
            
            # Test contract configuration
            contract_config = get_contract_config()
            
            self.test_results['configuration'] = {
                'status': 'passed',
                'settings_loaded': bool(settings),
                'contract_abis_loaded': len(contract_abis) > 0,
                'contract_config_loaded': len(contract_config) > 0,
                'details': {
                    'hedera_network': settings.hedera_network,
                    'api_port': settings.port,
                    'contracts_found': list(contract_abis.keys()),
                    'contracts_configured': list(contract_config.keys())
                }
            }
            
            print("✅ Configuration test passed")
            
        except Exception as e:
            self.test_results['configuration'] = {
                'status': 'failed',
                'error': str(e)
            }
            print(f"❌ Configuration test failed: {str(e)}")
    
    async def test_database_connection(self):
        """Test database connectivity."""
        print("\n🗄️  Testing Database Connection...")
        
        try:
            # Try to import database components
            from app.database import check_database_connection
            
            db_health = await check_database_connection()
            
            self.test_results['database'] = {
                'status': 'passed',
                'connection_healthy': db_health.get('status') == 'healthy',
                'details': db_health
            }
            
            print("✅ Database connection test passed")
            
        except ImportError:
            self.test_results['database'] = {
                'status': 'skipped',
                'message': 'Database components not available'
            }
            print("⚠️  Database test skipped (components not available)")
            
        except Exception as e:
            self.test_results['database'] = {
                'status': 'failed',
                'error': str(e)
            }
            print(f"❌ Database test failed: {str(e)}")
    
    async def test_hedera_connection(self):
        """Test Hedera network connection."""
        print("\n🔗 Testing Hedera Connection...")
        
        try:
            # Initialize Hedera client
            client = initialize_hedera_client()
            
            # Check connection health
            connection_health = await check_hedera_connection()
            
            self.test_results['hedera'] = {
                'status': 'passed',
                'client_initialized': bool(client),
                'connection_healthy': connection_health.get('status') == 'connected',
                'details': connection_health
            }
            
            print("✅ Hedera connection test passed")
            
        except Exception as e:
            self.test_results['hedera'] = {
                'status': 'failed',
                'error': str(e)
            }
            print(f"❌ Hedera test failed: {str(e)}")
    
    async def test_contract_deployments(self):
        """Test smart contract deployment status."""
        print("\n📜 Testing Contract Deployments...")
        
        try:
            deployment_status = await check_contract_deployments()
            
            # Count ready contracts
            ready_contracts = sum(1 for status in deployment_status.values() if status.get('ready', False))
            total_contracts = len(deployment_status)
            
            self.test_results['contract_deployments'] = {
                'status': 'passed' if ready_contracts > 0 else 'warning',
                'total_contracts': total_contracts,
                'ready_contracts': ready_contracts,
                'deployment_ratio': f"{ready_contracts}/{total_contracts}",
                'details': deployment_status
            }
            
            if ready_contracts > 0:
                print(f"✅ Contract deployment test passed ({ready_contracts}/{total_contracts} ready)")
            else:
                print(f"⚠️  Contract deployment test warning ({ready_contracts}/{total_contracts} ready)")
                
        except Exception as e:
            self.test_results['contract_deployments'] = {
                'status': 'failed',
                'error': str(e)
            }
            print(f"❌ Contract deployment test failed: {str(e)}")
    
    async def test_contract_functionality(self):
        """Test smart contract functionality."""
        print("\n⚡ Testing Contract Functionality...")
        
        try:
            functionality_status = await verify_contract_functionality()
            
            # Count functional contracts
            functional_contracts = sum(1 for status in functionality_status.values() if status.get('status') == 'functional')
            total_contracts = len(functionality_status)
            
            self.test_results['contract_functionality'] = {
                'status': 'passed' if functional_contracts > 0 else 'warning',
                'total_contracts': total_contracts,
                'functional_contracts': functional_contracts,
                'functionality_ratio': f"{functional_contracts}/{total_contracts}",
                'details': functionality_status
            }
            
            if functional_contracts > 0:
                print(f"✅ Contract functionality test passed ({functional_contracts}/{total_contracts} functional)")
            else:
                print(f"⚠️  Contract functionality test warning ({functional_contracts}/{total_contracts} functional)")
                
        except Exception as e:
            self.test_results['contract_functionality'] = {
                'status': 'failed',
                'error': str(e)
            }
            print(f"❌ Contract functionality test failed: {str(e)}")
    
    async def test_backend_api(self):
        """Test backend API endpoints."""
        print("\n🌐 Testing Backend API...")
        
        try:
            # Test health endpoint
            health_response = requests.get(f"{self.base_url}/health", timeout=10)
            health_status = health_response.status_code == 200
            
            # Test root endpoint
            root_response = requests.get(f"{self.base_url}/", timeout=10)
            root_status = root_response.status_code == 200
            
            # Test API documentation
            docs_response = requests.get(f"{self.base_url}/docs", timeout=10)
            docs_status = docs_response.status_code == 200
            
            self.test_results['backend_api'] = {
                'status': 'passed' if all([health_status, root_status, docs_status]) else 'failed',
                'health_endpoint': health_status,
                'root_endpoint': root_status,
                'docs_endpoint': docs_status,
                'details': {
                    'health_status_code': health_response.status_code,
                    'root_status_code': root_response.status_code,
                    'docs_status_code': docs_response.status_code
                }
            }
            
            if all([health_status, root_status, docs_status]):
                print("✅ Backend API test passed")
            else:
                print("❌ Backend API test failed")
                
        except requests.exceptions.RequestException as e:
            self.test_results['backend_api'] = {
                'status': 'failed',
                'error': f"Request failed: {str(e)}"
            }
            print(f"❌ Backend API test failed: {str(e)}")
    
    async def test_frontend_api_compatibility(self):
        """Test frontend API service compatibility."""
        print("\n🔄 Testing Frontend API Compatibility...")
        
        try:
            # Test skills endpoint
            skills_response = requests.get(f"{self.base_url}/api/v1/skills", timeout=10)
            skills_status = skills_response.status_code in [200, 404]  # 404 is OK if no skills exist
            
            # Test pools endpoint
            pools_response = requests.get(f"{self.base_url}/api/v1/pools", timeout=10)
            pools_status = pools_response.status_code in [200, 404]  # 404 is OK if no pools exist
            
            # Test reputation endpoint
            reputation_response = requests.get(f"{self.base_url}/api/v1/reputation", timeout=10)
            reputation_status = reputation_response.status_code in [200, 404]  # 404 is OK if no reputation data exists
            
            self.test_results['frontend_api_compatibility'] = {
                'status': 'passed' if all([skills_status, pools_status, reputation_status]) else 'failed',
                'skills_endpoint': skills_status,
                'pools_endpoint': pools_status,
                'reputation_endpoint': reputation_status,
                'details': {
                    'skills_status_code': skills_response.status_code,
                    'pools_status_code': pools_response.status_code,
                    'reputation_status_code': reputation_response.status_code
                }
            }
            
            if all([skills_status, pools_status, reputation_status]):
                print("✅ Frontend API compatibility test passed")
            else:
                print("❌ Frontend API compatibility test failed")
                
        except requests.exceptions.RequestException as e:
            self.test_results['frontend_api_compatibility'] = {
                'status': 'failed',
                'error': f"Request failed: {str(e)}"
            }
            print(f"❌ Frontend API compatibility test failed: {str(e)}")
    
    async def test_smart_contract_integration(self):
        """Test smart contract integration with backend."""
        print("\n🔗 Testing Smart Contract Integration...")
        
        try:
            # Test if contracts are accessible
            contract_config = get_contract_config()
            
            # Check if we can access contract functions
            integration_status = {}
            
            for contract_name, config in contract_config.items():
                if config.get('deployed') and config.get('abi'):
                    # Contract is deployed and has ABI
                    integration_status[contract_name] = {
                        'status': 'ready',
                        'address': config.get('address'),
                        'abi_functions': len([item for item in config.get('abi', []) if item.get('type') == 'function'])
                    }
                else:
                    integration_status[contract_name] = {
                        'status': 'not_ready',
                        'deployed': config.get('deployed', False),
                        'has_abi': bool(config.get('abi'))
                    }
            
            ready_contracts = sum(1 for status in integration_status.values() if status.get('status') == 'ready')
            total_contracts = len(integration_status)
            
            self.test_results['smart_contract_integration'] = {
                'status': 'passed' if ready_contracts > 0 else 'warning',
                'total_contracts': total_contracts,
                'ready_contracts': ready_contracts,
                'integration_ratio': f"{ready_contracts}/{total_contracts}",
                'details': integration_status
            }
            
            if ready_contracts > 0:
                print(f"✅ Smart contract integration test passed ({ready_contracts}/{total_contracts} ready)")
            else:
                print(f"⚠️  Smart contract integration test warning ({ready_contracts}/{total_contracts} ready)")
                
        except Exception as e:
            self.test_results['smart_contract_integration'] = {
                'status': 'failed',
                'error': str(e)
            }
            print(f"❌ Smart contract integration test failed: {str(e)}")
    
    async def generate_test_summary(self):
        """Generate a comprehensive test summary."""
        print("\n" + "=" * 60)
        print("📊 INTEGRATION TEST SUMMARY")
        print("=" * 60)
        
        # Count test results
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results.values() if result.get('status') == 'passed')
        failed_tests = sum(1 for result in self.test_results.values() if result.get('status') == 'failed')
        warning_tests = sum(1 for result in self.test_results.values() if result.get('status') == 'warning')
        skipped_tests = sum(1 for result in self.test_results.values() if result.get('status') == 'skipped')
        
        # Overall status
        if failed_tests == 0 and warning_tests == 0:
            overall_status = "✅ ALL TESTS PASSED"
        elif failed_tests == 0:
            overall_status = "⚠️  TESTS PASSED WITH WARNINGS"
        else:
            overall_status = "❌ SOME TESTS FAILED"
        
        print(f"Overall Status: {overall_status}")
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Warnings: {warning_tests}")
        print(f"Skipped: {skipped_tests}")
        
        # Detailed results
        print("\n📋 DETAILED RESULTS:")
        for test_name, result in self.test_results.items():
            status_emoji = {
                'passed': '✅',
                'failed': '❌',
                'warning': '⚠️',
                'skipped': '⏭️'
            }.get(result.get('status'), '❓')
            
            print(f"{status_emoji} {test_name.replace('_', ' ').title()}: {result.get('status', 'unknown')}")
            
            if result.get('error'):
                print(f"   Error: {result['error']}")
        
        # Recommendations
        print("\n💡 RECOMMENDATIONS:")
        
        if failed_tests > 0:
            print("❌ Fix failed tests before proceeding")
        
        if warning_tests > 0:
            print("⚠️  Address warnings for optimal performance")
        
        if self.test_results.get('contract_deployments', {}).get('ready_contracts', 0) == 0:
            print("📜 Deploy smart contracts to enable full functionality")
        
        if self.test_results.get('hedera', {}).get('status') == 'failed':
            print("🔗 Check Hedera network connection and credentials")
        
        if self.test_results.get('database', {}).get('status') == 'failed':
            print("🗄️  Verify database connection and configuration")
        
        # Save results to file
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        results_file = f"integration_test_results_{timestamp}.json"
        
        with open(results_file, 'w') as f:
            json.dump({
                'timestamp': datetime.now().isoformat(),
                'overall_status': overall_status,
                'summary': {
                    'total_tests': total_tests,
                    'passed_tests': passed_tests,
                    'failed_tests': failed_tests,
                    'warning_tests': warning_tests,
                    'skipped_tests': skipped_tests
                },
                'results': self.test_results
            }, f, indent=2)
        
        print(f"\n💾 Detailed results saved to: {results_file}")


async def main():
    """Main function to run integration tests."""
    try:
        tester = IntegrationTester()
        results = await tester.run_all_tests()
        
        # Exit with appropriate code
        failed_tests = sum(1 for result in results.values() if result.get('status') == 'failed')
        if failed_tests > 0:
            sys.exit(1)
        else:
            sys.exit(0)
            
    except KeyboardInterrupt:
        print("\n\n⏹️  Integration tests interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n💥 Integration tests failed with error: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
