# Sudoku-OCR

A small toy web project allowing to scan sudoku puzzles from newspapers your camera and play them in sudokuexchange.org.

## Project setup

### Train digit OCR model

You should have a conda compatible distribution of python installed. Enter the 'python/' subdir, then create a python environment with:

```bash
$ cd python/
$ mamba env create -f environment.yml -n sudoku-ocr
```

I prefer mamba over conda. If using conda just change mamba for conda above.

After creating our python environment, switch to it, source the .env file and start jupyter notebook.

```bash
$ mamba activate sudoku-ocr
$ source .env
$ jupyter-notebook
```

In order to use the notebook 01\_MNIST\_keras\_model.ipynb you should first setup your training data. The provided script 00\_Prepare\_digit\_dataset.sh scans your system installed fonts and creates 28x28 pngs for each font and each number in a folder structure approppriate to use with keras generators. So you just:

```bash
$ bash 00_Prepare_digit_dataset.sh
```

After running a directory data/digit-data should appear, with 10 subdirectories named 0-9. You should manually clean the produced images removing blank images and icon fonts.

Finally, you just run the mentioned jupyter notebook. It trains and saves a keras model which will be later usable from javascript on the client.

## Licence

MIT. See [LICENCE](LICENCE) file.
