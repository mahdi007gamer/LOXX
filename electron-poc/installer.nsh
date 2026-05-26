!macro customInstall
  CreateDirectory "$LOCALAPPDATA\loxx-updater"
  Delete "$LOCALAPPDATA\loxx-updater\installer.exe"
  CopyFiles /SILENT "$EXEPATH" "$LOCALAPPDATA\loxx-updater\installer.exe"
!macroend

!macro customUninstall
  Delete "$LOCALAPPDATA\loxx-updater\installer.exe"
  RMDir "$LOCALAPPDATA\loxx-updater"
!macroend
