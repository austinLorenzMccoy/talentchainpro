#!/usr/bin/env python3
"""Setup script for TalentChain Pro."""

from setuptools import setup, find_packages

setup(
    name="talentchainpro",
    version="0.1.0",
    package_dir={"": "backend"},
    packages=find_packages(where="backend"),
    python_requires=">=3.10",
)
