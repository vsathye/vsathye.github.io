# Data Directory Structure

This directory contains both raw and processed data for the historical map visualization:

## Raw Data (/raw)
- governments.csv: Primary data about historical governments
- interactions.csv: Records of interactions between governments

## Processed Data (/processed)
- /governments: Processed and cached government data
- /interactions: Processed and cached interaction data

Data processing scripts will read from /raw and generate optimized files in /processed for efficient visualization and analysis.