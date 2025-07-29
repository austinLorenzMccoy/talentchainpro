"""
Tests for Pools API

This module contains tests for the job pools API endpoints.
"""

import pytest
from fastapi import status
from starlette.testclient import TestClient
from unittest.mock import patch, MagicMock

def test_create_job_pool(
    test_client: TestClient,
    job_pool_request: dict
):
    """
    Test creating a job pool.
    
    Args:
        async_client: Async test client
        job_pool_request: Sample job pool request
    """
    response = test_client.post("/api/v1/pools/", json=job_pool_request)
    
    assert response.status_code == status.HTTP_201_CREATED
    assert "pool_id" in response.json()
    assert response.json()["company_id"] == job_pool_request["company_id"]
    assert response.json()["job_title"] == job_pool_request["job_title"]
    assert response.json()["status"] == "active"
    assert "transaction_id" in response.json()

def test_create_job_pool_validation_error(
    test_client: TestClient
):
    """
    Test validation error when creating a job pool.
    
    Args:
        async_client: Async test client
    """
    # Missing required fields
    invalid_request = {
        "company_id": "0.0.12345",
        "job_title": "Senior Blockchain Developer"
        # Missing other required fields
    }
    
    response = test_client.post("/api/v1/pools/", json=invalid_request)
    
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    assert "detail" in response.json()

def test_get_job_pool(
    test_client: TestClient,
    job_pool_request: dict
):
    """
    Test getting a job pool.
    
    Args:
        async_client: Async test client
        job_pool_request: Sample job pool request to create a pool first
    """
    # First create a pool
    create_response = test_client.post("/api/v1/pools/", json=job_pool_request)
    pool_id = create_response.json()["pool_id"]
    
    # Then get the pool
    response = test_client.get(f"/api/v1/pools/{pool_id}")
    
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["pool_id"] == pool_id
    assert response.json()["company_id"] == job_pool_request["company_id"]
    assert response.json()["job_title"] == job_pool_request["job_title"]

def test_get_job_pool_not_found(
    test_client: TestClient
):
    """
    Test getting a non-existent job pool.
    
    Args:
        async_client: Async test client
    """
    non_existent_pool_id = "0.0.99999"
    
    response = test_client.get(f"/api/v1/pools/{non_existent_pool_id}")
    
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "detail" in response.json()

def test_list_job_pools(
    test_client: TestClient,
    job_pool_request: dict
):
    """
    Test listing job pools.
    
    Args:
        async_client: Async test client
        job_pool_request: Sample job pool request to create a pool first
    """
    # First create a pool
    test_client.post("/api/v1/pools/", json=job_pool_request)
    
    # Then list pools
    response = test_client.get("/api/v1/pools/")
    
    assert response.status_code == status.HTTP_200_OK
    assert isinstance(response.json(), list)
    assert len(response.json()) > 0
    assert response.json()[0]["company_id"] == job_pool_request["company_id"]

def test_list_job_pools_with_filters(
    test_client: TestClient,
    job_pool_request: dict
):
    """
    Test listing job pools with filters.
    
    Args:
        async_client: Async test client
        job_pool_request: Sample job pool request to create a pool first
    """
    # First create a pool
    test_client.post("/api/v1/pools/", json=job_pool_request)
    
    # Then list pools with company_id filter
    company_id = job_pool_request["company_id"]
    response = test_client.get(f"/api/v1/pools/?company_id={company_id}")
    
    assert response.status_code == status.HTTP_200_OK
    assert isinstance(response.json(), list)
    assert len(response.json()) > 0
    assert all(pool["company_id"] == company_id for pool in response.json())

def test_join_pool(
    test_client: TestClient,
    job_pool_request: dict
):
    """
    Test joining a job pool.
    
    Args:
        async_client: Async test client
        job_pool_request: Sample job pool request to create a pool first
    """
    # First create a pool
    create_response = test_client.post("/api/v1/pools/", json=job_pool_request)
    pool_id = create_response.json()["pool_id"]
    
    # Then join the pool
    join_request = {
        "candidate_id": "0.0.54321",
        "skill_token_ids": ["0.0.54321", "0.0.54322"],
        "stake_amount": 50.0
    }
    
    response = test_client.post(f"/api/v1/pools/{pool_id}/join", json=join_request)
    
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["pool_id"] == pool_id
    assert response.json()["candidate_id"] == join_request["candidate_id"]
    assert response.json()["status"] == "joined"
    assert "transaction_id" in response.json()

def test_join_pool_not_found(
    test_client: TestClient
):
    """
    Test joining a non-existent job pool.
    
    Args:
        async_client: Async test client
    """
    non_existent_pool_id = "0.0.99999"
    
    join_request = {
        "candidate_id": "0.0.54321",
        "skill_token_ids": ["0.0.54321", "0.0.54322"],
        "stake_amount": 50.0
    }
    
    response = test_client.post(f"/api/v1/pools/{non_existent_pool_id}/join", json=join_request)
    
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "detail" in response.json()

def test_join_pool_already_joined(
    test_client: TestClient,
    job_pool_request: dict
):
    """
    Test joining a job pool that the candidate has already joined.
    
    Args:
        async_client: Async test client
        job_pool_request: Sample job pool request to create a pool first
    """
    # First create a pool
    create_response = test_client.post("/api/v1/pools/", json=job_pool_request)
    pool_id = create_response.json()["pool_id"]
    
    # Join the pool
    join_request = {
        "candidate_id": "0.0.54321",
        "skill_token_ids": ["0.0.54321", "0.0.54322"],
        "stake_amount": 50.0
    }
    
    test_client.post(f"/api/v1/pools/{pool_id}/join", json=join_request)
    
    # Try to join again with the same candidate
    response = test_client.post(f"/api/v1/pools/{pool_id}/join", json=join_request)
    
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "detail" in response.json()

def test_leave_pool(
    test_client: TestClient,
    job_pool_request: dict
):
    """
    Test leaving a job pool.
    
    Args:
        async_client: Async test client
        job_pool_request: Sample job pool request to create a pool first
    """
    # First create a pool
    create_response = test_client.post("/api/v1/pools/", json=job_pool_request)
    pool_id = create_response.json()["pool_id"]
    
    # Join the pool
    join_request = {
        "candidate_id": "0.0.54321",
        "skill_token_ids": ["0.0.54321", "0.0.54322"],
        "stake_amount": 50.0
    }
    
    test_client.post(f"/api/v1/pools/{pool_id}/join", json=join_request)
    
    # Then leave the pool
    candidate_id = join_request["candidate_id"]
    response = test_client.post(f"/api/v1/pools/{pool_id}/leave?candidate_id={candidate_id}")
    
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["pool_id"] == pool_id
    assert response.json()["candidate_id"] == candidate_id
    assert response.json()["status"] == "left"
    assert "transaction_id" in response.json()

def test_leave_pool_not_found(
    test_client: TestClient
):
    """
    Test leaving a non-existent job pool.
    
    Args:
        async_client: Async test client
    """
    non_existent_pool_id = "0.0.99999"
    candidate_id = "0.0.54321"
    
    response = test_client.post(f"/api/v1/pools/{non_existent_pool_id}/leave?candidate_id={candidate_id}")
    
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "detail" in response.json()

def test_leave_pool_candidate_not_found(
    test_client: TestClient,
    job_pool_request: dict
):
    """
    Test leaving a job pool with a candidate that hasn't joined.
    
    Args:
        async_client: Async test client
        job_pool_request: Sample job pool request to create a pool first
    """
    # First create a pool
    create_response = test_client.post("/api/v1/pools/", json=job_pool_request)
    pool_id = create_response.json()["pool_id"]
    
    # Try to leave with a candidate that hasn't joined
    non_existent_candidate_id = "0.0.99999"
    response = test_client.post(f"/api/v1/pools/{pool_id}/leave?candidate_id={non_existent_candidate_id}")
    
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "detail" in response.json()

def test_make_match(
    test_client: TestClient,
    job_pool_request: dict
):
    """
    Test making a match between a company and a candidate.
    
    Args:
        async_client: Async test client
        job_pool_request: Sample job pool request to create a pool first
    """
    # First create a pool
    create_response = test_client.post("/api/v1/pools/", json=job_pool_request)
    pool_id = create_response.json()["pool_id"]
    
    # Join the pool
    join_request = {
        "candidate_id": "0.0.54321",
        "skill_token_ids": ["0.0.54321", "0.0.54322"],
        "stake_amount": 50.0
    }
    
    test_client.post(f"/api/v1/pools/{pool_id}/join", json=join_request)
    
    # Then make a match
    match_request = {
        "company_id": job_pool_request["company_id"],
        "candidate_id": join_request["candidate_id"]
    }
    
    response = test_client.post(f"/api/v1/pools/{pool_id}/match", json=match_request)
    
    assert response.status_code == status.HTTP_200_OK
    assert "match_id" in response.json()
    assert response.json()["pool_id"] == pool_id
    assert response.json()["company_id"] == match_request["company_id"]
    assert response.json()["candidate_id"] == match_request["candidate_id"]
    assert response.json()["status"] == "matched"
    assert "transaction_id" in response.json()

def test_make_match_pool_not_found(
    test_client: TestClient
):
    """
    Test making a match in a non-existent job pool.
    
    Args:
        async_client: Async test client
    """
    non_existent_pool_id = "0.0.99999"
    
    match_request = {
        "company_id": "0.0.12345",
        "candidate_id": "0.0.54321"
    }
    
    response = test_client.post(f"/api/v1/pools/{non_existent_pool_id}/match", json=match_request)
    
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "detail" in response.json()

def test_make_match_wrong_company(
    test_client: TestClient,
    job_pool_request: dict
):
    """
    Test making a match with a company that doesn't own the pool.
    
    Args:
        async_client: Async test client
        job_pool_request: Sample job pool request to create a pool first
    """
    # First create a pool
    create_response = test_client.post("/api/v1/pools/", json=job_pool_request)
    pool_id = create_response.json()["pool_id"]
    
    # Join the pool
    join_request = {
        "candidate_id": "0.0.54321",
        "skill_token_ids": ["0.0.54321", "0.0.54322"],
        "stake_amount": 50.0
    }
    
    test_client.post(f"/api/v1/pools/{pool_id}/join", json=join_request)
    
    # Try to make a match with a different company
    wrong_company_id = "0.0.99999"
    match_request = {
        "company_id": wrong_company_id,
        "candidate_id": join_request["candidate_id"]
    }
    
    response = test_client.post(f"/api/v1/pools/{pool_id}/match", json=match_request)
    
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "detail" in response.json()

def test_make_match_candidate_not_found(
    test_client: TestClient,
    job_pool_request: dict
):
    """
    Test making a match with a candidate that hasn't joined the pool.
    
    Args:
        async_client: Async test client
        job_pool_request: Sample job pool request to create a pool first
    """
    # First create a pool
    create_response = test_client.post("/api/v1/pools/", json=job_pool_request)
    pool_id = create_response.json()["pool_id"]
    
    # Try to make a match with a candidate that hasn't joined
    non_existent_candidate_id = "0.0.99999"
    match_request = {
        "company_id": job_pool_request["company_id"],
        "candidate_id": non_existent_candidate_id
    }
    
    response = test_client.post(f"/api/v1/pools/{pool_id}/match", json=match_request)
    
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "detail" in response.json()

def test_get_pool_candidates(
    test_client: TestClient,
    job_pool_request: dict
):
    """
    Test getting candidates in a job pool.
    
    Args:
        test_client: Test client
        job_pool_request: Sample job pool request to create a pool first
    """
    # First create a pool
    create_response = test_client.post("/api/v1/pools/", json=job_pool_request)
    pool_id = create_response.json()["pool_id"]
    
    # Join the pool with multiple candidates
    for i in range(3):
        join_request = {
            "candidate_id": f"0.0.{54321 + i}",
            "skill_token_ids": ["0.0.54321", "0.0.54322"],
            "stake_amount": 50.0
        }
        test_client.post(f"/api/v1/pools/{pool_id}/join", json=join_request)
    
    # Get pool candidates
    response = test_client.get(f"/api/v1/pools/{pool_id}/candidates")
    
    assert response.status_code == status.HTTP_200_OK
    assert isinstance(response.json(), list)
    assert len(response.json()) == 3
    for candidate in response.json():
        assert candidate["candidate_id"] in [f"0.0.{54321 + i}" for i in range(3)]
        assert candidate["skill_token_ids"] == ["0.0.54321", "0.0.54322"]

def test_get_pool_candidates_not_found(
    test_client: TestClient
):
    """
    Test getting candidates in a non-existent job pool.
    
    Args:
        async_client: Async test client
    """
    non_existent_pool_id = "0.0.99999"
    
    response = test_client.get(f"/api/v1/pools/{non_existent_pool_id}/candidates")
    
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "detail" in response.json()
